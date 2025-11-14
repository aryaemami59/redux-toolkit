import type { UnknownAction } from '@reduxjs/toolkit'
import type { BaseQueryFn } from './baseQueryTypes'
import type { CombinedState, CoreModule, QueryKeys } from './core'
import type { ApiModules } from './core/module'
import type { CreateApiOptions } from './createApi'
import type {
  EndpointBuilder,
  EndpointDefinition,
  EndpointDefinitions,
  UpdateDefinitions,
} from './endpointDefinitions'
import type {
  NoInfer,
  UnionToIntersection,
  WithRequiredProp,
} from './tsHelpers'

export type ModuleName = keyof ApiModules<any, any, any, any>

export type Module<Name extends ModuleName> = {
  name: Name
  init<
    BaseQueryFunctionType extends BaseQueryFn,
    DefinitionsType extends EndpointDefinitions,
    ReducerPathType extends string,
    ApiTagTypes extends string,
  >(
    api: Api<
      BaseQueryFunctionType,
      EndpointDefinitions,
      ReducerPathType,
      ApiTagTypes,
      ModuleName
    >,
    options: WithRequiredProp<
      CreateApiOptions<
        BaseQueryFunctionType,
        DefinitionsType,
        ReducerPathType,
        ApiTagTypes
      >,
      | 'reducerPath'
      | 'serializeQueryArgs'
      | 'keepUnusedDataFor'
      | 'refetchOnMountOrArgChange'
      | 'refetchOnFocus'
      | 'refetchOnReconnect'
      | 'invalidationBehavior'
      | 'tagTypes'
    >,
    context: ApiContext<DefinitionsType>,
  ): {
    injectEndpoint(
      endpointName: string,
      definition: EndpointDefinition<any, any, any, any>,
    ): void
  }
}

export interface ApiContext<DefinitionsType extends EndpointDefinitions> {
  apiUid: string
  endpointDefinitions: DefinitionsType
  batch(cb: () => void): void
  extractRehydrationInfo: (
    action: UnknownAction,
  ) => CombinedState<any, any, any> | undefined
  hasRehydrationInfo: (action: UnknownAction) => boolean
}

export const getEndpointDefinition = <
  Definitions extends EndpointDefinitions,
  EndpointName extends keyof Definitions,
>(
  context: ApiContext<Definitions>,
  endpointName: EndpointName,
) => context.endpointDefinitions[endpointName]

export type Api<
  BaseQuery extends BaseQueryFn,
  DefinitionsType extends EndpointDefinitions,
  ReducerPathType extends string,
  ApiTagTypes extends string,
  Enhancers extends ModuleName = CoreModule,
> = UnionToIntersection<
  ApiModules<
    BaseQuery,
    DefinitionsType,
    ReducerPathType,
    ApiTagTypes
  >[Enhancers]
> & {
  /**
   * A function to inject the endpoints into the original API, but also give you that same API with correct types for these endpoints back. Useful with code-splitting.
   */
  injectEndpoints<NewDefinitions extends EndpointDefinitions>(_: {
    endpoints: (
      build: EndpointBuilder<BaseQuery, ApiTagTypes, ReducerPathType>,
    ) => NewDefinitions
    /**
     * Optionally allows endpoints to be overridden if defined by multiple `injectEndpoints` calls.
     *
     * If set to `true`, will override existing endpoints with the new definition.
     * If set to `'throw'`, will throw an error if an endpoint is redefined with a different definition.
     * If set to `false` (or unset), will not override existing endpoints with the new definition, and log a warning in development.
     */
    overrideExisting?: boolean | 'throw'
  }): Api<
    BaseQuery,
    DefinitionsType & NewDefinitions,
    ReducerPathType,
    ApiTagTypes,
    Enhancers
  >
  /**
   *A function to enhance a generated API with additional information. Useful with code-generation.
   */
  enhanceEndpoints<
    NewTagTypes extends string = never,
    NewDefinitions extends EndpointDefinitions = never,
  >(_: {
    addTagTypes?: readonly NewTagTypes[]
    endpoints?: UpdateDefinitions<
      DefinitionsType,
      ApiTagTypes | NoInfer<NewTagTypes>,
      NewDefinitions
    > extends infer NewDefinitions
      ? {
          [K in keyof NewDefinitions]?:
            | Partial<NewDefinitions[K]>
            | ((definition: NewDefinitions[K]) => void)
        }
      : never
  }): Api<
    BaseQuery,
    UpdateDefinitions<
      DefinitionsType,
      ApiTagTypes | NewTagTypes,
      NewDefinitions
    >,
    ReducerPathType,
    ApiTagTypes | NewTagTypes,
    Enhancers
  >
}
