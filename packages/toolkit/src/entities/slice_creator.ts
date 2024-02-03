import type { PayloadAction } from '../createAction'
import type {
  SliceCaseReducers,
  ReducerCreatorEntry,
  CaseReducerDefinition,
  ReducerCreator,
  ReducerCreators,
} from '../createSlice'
import type {
  EntityAdapter,
  EntityId,
  EntityState,
  EntityStateAdapter,
} from './models'
import { capitalize } from './utils'

export const entityMethodsCreatorType = Symbol()

type EntityReducers<
  T,
  Id extends EntityId,
  State = EntityState<T, Id>,
  Single extends string = '',
  Plural extends string = `${Single}s`,
> = {
  [K in keyof EntityStateAdapter<
    T,
    Id
  > as `${K}${Single extends '' ? '' : Capitalize<K extends `${string}One` ? Single : Plural>}`]: EntityStateAdapter<
    T,
    Id
  >[K] extends infer Method
    ? Method extends (state: any, action: PayloadAction<void>) => any
      ? CaseReducerDefinition<State, PayloadAction<void>>
      : Method extends (state: any, action: PayloadAction<infer Payload>) => any
        ? CaseReducerDefinition<State, PayloadAction<Payload>>
        : never
    : never
}

type entityMethodsCreator<State> =
  State extends EntityState<infer T, infer Id>
    ? {
        <
          T,
          Id extends EntityId,
          Single extends string = '',
          Plural extends string = `${Single}s`,
        >(
          this: ReducerCreators<State>,
          adapter: EntityAdapter<T, Id>,
          config: {
            selectEntityState: (state: State) => EntityState<T, Id>
            name?: Single
            pluralName?: Plural
          },
        ): EntityReducers<T, Id, State, Single, Plural>
        <Single extends string = '', Plural extends string = `${Single}s`>(
          this: ReducerCreators<State>,
          adapter: EntityAdapter<T, Id>,
          config?: {
            name?: Single
            pluralName?: Plural
          },
        ): EntityReducers<T, Id, State, Single, Plural>
      }
    : <
        T,
        Id extends EntityId,
        Single extends string = '',
        Plural extends string = `${Single}s`,
      >(
        this: ReducerCreators<State>,
        adapter: EntityAdapter<T, Id>,
        config: {
          selectEntityState: (state: State) => EntityState<T, Id>
          name?: Single
          pluralName?: Plural
        },
      ) => EntityReducers<T, Id, State, Single, Plural>

declare module '@reduxjs/toolkit' {
  export interface SliceReducerCreators<
    State = any,
    CaseReducers extends SliceCaseReducers<State> = SliceCaseReducers<State>,
    Name extends string = string,
  > {
    [entityMethodsCreatorType]: ReducerCreatorEntry<entityMethodsCreator<State>>
  }
}

export const entityMethodsCreator: ReducerCreator<
  typeof entityMethodsCreatorType
> = {
  type: entityMethodsCreatorType,
  create(
    adapter,
    {
      selectEntityState = (state) => state,
      name = '',
      pluralName = '',
    }: {
      selectEntityState?: (state: any) => any
      name?: '' // required for proper key checking
      pluralName?: ''
    } = {},
  ): EntityReducers<any, EntityId, any> {
    return {
      [`addOne${capitalize(name)}` as const]: this.reducer<any>(
        (state, action) => {
          adapter.addOne(selectEntityState(state), action.payload)
        },
      ),
      [`addMany${capitalize(pluralName)}` as const]: this.reducer<any>(
        (state, action) => {
          adapter.addMany(selectEntityState(state), action.payload)
        },
      ),
      [`setOne${capitalize(name)}` as const]: this.reducer<any>(
        (state, action) => {
          adapter.setOne(selectEntityState(state), action.payload)
        },
      ),
      [`setMany${capitalize(pluralName)}` as const]: this.reducer<any>(
        (state, action) => {
          adapter.setMany(selectEntityState(state), action.payload)
        },
      ),
      [`setAll${capitalize(pluralName)}` as const]: this.reducer<any>(
        (state, action) => {
          adapter.setAll(selectEntityState(state), action.payload)
        },
      ),
      [`removeOne${capitalize(name)}` as const]: this.reducer<any>(
        (state, action) => {
          adapter.removeOne(selectEntityState(state), action.payload)
        },
      ),
      [`removeMany${capitalize(pluralName)}` as const]: this.reducer<any>(
        (state, action) => {
          adapter.removeMany(selectEntityState(state), action.payload)
        },
      ),
      [`removeAll${capitalize(pluralName)}` as const]: this.reducer((state) => {
        adapter.removeAll(selectEntityState(state))
      }),
      [`upsertOne${capitalize(name)}` as const]: this.reducer<any>(
        (state, action) => {
          adapter.upsertOne(selectEntityState(state), action.payload)
        },
      ),
      [`upsertMany${capitalize(pluralName)}` as const]: this.reducer<any>(
        (state, action) => {
          adapter.upsertMany(selectEntityState(state), action.payload)
        },
      ),
      [`updateOne${capitalize(name)}` as const]: this.reducer<any>(
        (state, action) => {
          adapter.updateOne(selectEntityState(state), action.payload)
        },
      ),
      [`updateMany${capitalize(pluralName)}` as const]: this.reducer<any>(
        (state, action) => {
          adapter.updateMany(selectEntityState(state), action.payload)
        },
      ),
    }
  },
}
