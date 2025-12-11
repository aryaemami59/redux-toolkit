import type { PayloadAction } from '../createAction'
import type { Draft } from '../immerImports'
import type { CastAny, Id } from '../tsHelpers'
import type { UncheckedIndexedAccess } from '../uncheckedindexed.js'
import type { GetSelectorsOptions } from './state_selectors'

/**
 * @public
 */
export type EntityId = number | string

/**
 * @public
 */
export type Comparer<T> = (a: T, b: T) => number

/**
 * @public
 */
export type IdSelector<T, EntityIdType extends EntityId> = (
  model: T,
) => EntityIdType

/**
 * @public
 */
export type Update<T, EntityIdType extends EntityId> = {
  id: EntityIdType
  changes: Partial<T>
}

/**
 * @public
 */
export interface EntityState<T, EntityIdType extends EntityId> {
  ids: EntityIdType[]
  entities: Record<EntityIdType, T>
}

/**
 * @public
 */
export interface EntityAdapterOptions<T, EntityIdType extends EntityId> {
  selectId?: IdSelector<T, EntityIdType>
  sortComparer?: false | Comparer<T>
}

export type PreventAny<S, T, EntityIdType extends EntityId> = CastAny<
  S,
  EntityState<T, EntityIdType>
>

export type DraftableEntityState<T, EntityIdType extends EntityId> =
  | EntityState<T, EntityIdType>
  | Draft<EntityState<T, EntityIdType>>

/**
 * @public
 */
export interface EntityStateAdapter<T, EntityIdType extends EntityId> {
  addOne<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
    entity: T,
  ): S
  addOne<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
    action: PayloadAction<T>,
  ): S

  addMany<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
    entities: readonly T[] | Record<EntityIdType, T>,
  ): S
  addMany<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
    entities: PayloadAction<readonly T[] | Record<EntityIdType, T>>,
  ): S

  setOne<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
    entity: T,
  ): S
  setOne<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
    action: PayloadAction<T>,
  ): S
  setMany<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
    entities: readonly T[] | Record<EntityIdType, T>,
  ): S
  setMany<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
    entities: PayloadAction<readonly T[] | Record<EntityIdType, T>>,
  ): S
  setAll<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
    entities: readonly T[] | Record<EntityIdType, T>,
  ): S
  setAll<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
    entities: PayloadAction<readonly T[] | Record<EntityIdType, T>>,
  ): S

  removeOne<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
    key: EntityIdType,
  ): S
  removeOne<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
    key: PayloadAction<EntityIdType>,
  ): S

  removeMany<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
    keys: readonly EntityIdType[],
  ): S
  removeMany<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
    keys: PayloadAction<readonly EntityIdType[]>,
  ): S

  removeAll<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
  ): S

  updateOne<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
    update: Update<T, EntityIdType>,
  ): S
  updateOne<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
    update: PayloadAction<Update<T, EntityIdType>>,
  ): S

  updateMany<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
    updates: ReadonlyArray<Update<T, EntityIdType>>,
  ): S
  updateMany<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
    updates: PayloadAction<ReadonlyArray<Update<T, EntityIdType>>>,
  ): S

  upsertOne<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
    entity: T,
  ): S
  upsertOne<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
    entity: PayloadAction<T>,
  ): S

  upsertMany<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
    entities: readonly T[] | Record<EntityIdType, T>,
  ): S
  upsertMany<S extends DraftableEntityState<T, EntityIdType>>(
    state: PreventAny<S, T, EntityIdType>,
    entities: PayloadAction<readonly T[] | Record<EntityIdType, T>>,
  ): S
}

/**
 * @public
 */
export interface EntitySelectors<T, V, IdType extends EntityId> {
  selectIds: (state: V) => IdType[]
  selectEntities: (state: V) => Record<IdType, T>
  selectAll: (state: V) => T[]
  selectTotal: (state: V) => number
  selectById: (state: V, id: IdType) => Id<UncheckedIndexedAccess<T>>
}

/**
 * @public
 */
export interface EntityStateFactory<T, EntityIdType extends EntityId> {
  getInitialState(
    state?: undefined,
    entities?: Record<EntityIdType, T> | readonly T[],
  ): EntityState<T, EntityIdType>
  getInitialState<S extends object>(
    state: S,
    entities?: Record<EntityIdType, T> | readonly T[],
  ): EntityState<T, EntityIdType> & S
}

/**
 * @public
 */
export interface EntityAdapter<T, EntityIdType extends EntityId>
  extends
    EntityStateAdapter<T, EntityIdType>,
    EntityStateFactory<T, EntityIdType>,
    Required<EntityAdapterOptions<T, EntityIdType>> {
  getSelectors(
    selectState?: undefined,
    options?: GetSelectorsOptions,
  ): EntitySelectors<T, EntityState<T, EntityIdType>, EntityIdType>
  getSelectors<V>(
    selectState: (state: V) => EntityState<T, EntityIdType>,
    options?: GetSelectorsOptions,
  ): EntitySelectors<T, V, EntityIdType>
}
