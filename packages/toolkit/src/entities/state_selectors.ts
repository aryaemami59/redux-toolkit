import { createDraftSafeSelector } from '../createDraftSafeSelector'
import type { CreateSelectorFunction, Selector } from '../reselectImports'
import type { EntityId, EntitySelectors, EntityState } from './models'

type AnyCreateSelectorFunction = CreateSelectorFunction<any, any, any>

export type GetSelectorsOptions = {
  createSelector?: AnyCreateSelectorFunction
}

export function createSelectorsFactory<T, EntityIdType extends EntityId>() {
  function getSelectors(
    selectState?: undefined,
    options?: GetSelectorsOptions,
  ): EntitySelectors<T, EntityState<T, EntityIdType>, EntityIdType>
  function getSelectors<V>(
    selectState: (state: V) => EntityState<T, EntityIdType>,
    options?: GetSelectorsOptions,
  ): EntitySelectors<T, V, EntityIdType>
  function getSelectors<V>(
    selectState?: (state: V) => EntityState<T, EntityIdType>,
    options: GetSelectorsOptions = {},
  ): EntitySelectors<T, any, EntityIdType> {
    const {
      createSelector = createDraftSafeSelector as AnyCreateSelectorFunction,
    } = options

    const selectIds = (state: EntityState<T, EntityIdType>) => state.ids

    const selectEntities = (state: EntityState<T, EntityIdType>) =>
      state.entities

    const selectAll = createSelector(
      selectIds,
      selectEntities,
      (ids, entities): T[] => ids.map((id) => entities[id]!),
    )

    const selectId = (_: unknown, id: EntityIdType) => id

    const selectById = (entities: Record<EntityIdType, T>, id: EntityIdType) =>
      entities[id]

    const selectTotal = createSelector(selectIds, (ids) => ids.length)

    if (!selectState) {
      return {
        selectIds,
        selectEntities,
        selectAll,
        selectTotal,
        selectById: createSelector(selectEntities, selectId, selectById),
      }
    }

    const selectGlobalizedEntities = createSelector(
      selectState as Selector<V, EntityState<T, EntityIdType>>,
      selectEntities,
    )

    return {
      selectIds: createSelector(selectState, selectIds),
      selectEntities: selectGlobalizedEntities,
      selectAll: createSelector(selectState, selectAll),
      selectTotal: createSelector(selectState, selectTotal),
      selectById: createSelector(
        selectGlobalizedEntities,
        selectId,
        selectById,
      ),
    }
  }

  return { getSelectors }
}
