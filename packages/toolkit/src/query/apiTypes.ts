import type { UnknownAction } from '@reduxjs/toolkit'
import type { BaseQueryFn } from './baseQueryTypes'
import type { CombinedState, CoreModule } from './core/index'
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
    EndpointDefinitionsType extends EndpointDefinitions,
    ReducerPathType extends string,
    TagTypes extends string,
  >(
    api: Api<
      BaseQueryFunctionType,
      EndpointDefinitions,
      ReducerPathType,
      TagTypes,
      ModuleName
    >,
    options: WithRequiredProp<
      CreateApiOptions<
        BaseQueryFunctionType,
        EndpointDefinitionsType,
        ReducerPathType,
        TagTypes
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
    context: ApiContext<EndpointDefinitionsType>,
  ): {
    injectEndpoint(
      endpointName: string,
      definition: EndpointDefinition<any, any, any, any>,
    ): void
  }
}

export interface ApiContext<
  EndpointDefinitionsType extends EndpointDefinitions,
> {
  apiUid: string
  endpointDefinitions: EndpointDefinitionsType
  batch(cb: () => void): void
  extractRehydrationInfo: (
    action: UnknownAction,
  ) => CombinedState<any, any, any> | undefined
  hasRehydrationInfo: (action: UnknownAction) => boolean
}

export const getEndpointDefinition = <
  EndpointDefinitionsType extends EndpointDefinitions,
  EndpointName extends keyof EndpointDefinitionsType,
>(
  context: ApiContext<EndpointDefinitionsType>,
  endpointName: EndpointName,
) => context.endpointDefinitions[endpointName]

export type Api<
  BaseQueryFunctionType extends BaseQueryFn,
  EndpointDefinitionsType extends EndpointDefinitions,
  ReducerPathType extends string,
  TagType extends string,
  Enhancers extends ModuleName = CoreModule,
> = UnionToIntersection<
  ApiModules<
    BaseQueryFunctionType,
    EndpointDefinitionsType,
    ReducerPathType,
    TagType
  >[Enhancers]
> & {
  /**
   * A function to inject the endpoints into the original API, but also give you that same API with correct types for these endpoints back. Useful with code-splitting.
   */
  injectEndpoints<NewEndpointDefinitionsType extends EndpointDefinitions>(_: {
    endpoints: (
      build: EndpointBuilder<BaseQueryFunctionType, TagType, ReducerPathType>,
    ) => NewEndpointDefinitionsType
    /**
     * Optionally allows endpoints to be overridden if defined by multiple `injectEndpoints` calls.
     *
     * If set to `true`, will override existing endpoints with the new definition.
     * If set to `'throw'`, will throw an error if an endpoint is redefined with a different definition.
     * If set to `false` (or unset), will not override existing endpoints with the new definition, and log a warning in development.
     */
    overrideExisting?: boolean | 'throw'
  }): Api<
    BaseQueryFunctionType,
    EndpointDefinitionsType & NewEndpointDefinitionsType,
    ReducerPathType,
    TagType,
    Enhancers
  >
  /**
   *A function to enhance a generated API with additional information. Useful with code-generation.
   */
  enhanceEndpoints<
    NewTagType extends string = never,
    NewEndpointDefinitionsType extends EndpointDefinitions = never,
  >(_: {
    addTagTypes?: readonly NewTagType[]
    endpoints?: UpdateDefinitions<
      EndpointDefinitionsType,
      TagType | NoInfer<NewTagType>,
      NewEndpointDefinitionsType
    > extends infer InferredNewEndpointDefinitionsType
      ? {
          [K in keyof InferredNewEndpointDefinitionsType]?:
            | Partial<InferredNewEndpointDefinitionsType[K]>
            | ((definition: InferredNewEndpointDefinitionsType[K]) => void)
        }
      : never
  }): Api<
    BaseQueryFunctionType,
    UpdateDefinitions<
      EndpointDefinitionsType,
      TagType | NewTagType,
      NewEndpointDefinitionsType
    >,
    ReducerPathType,
    TagType | NewTagType,
    Enhancers
  >
}
