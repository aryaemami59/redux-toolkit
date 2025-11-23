import type {
  DefinitionType,
  EndpointDefinitions,
  InfiniteQueryDefinition,
  MutationDefinition,
  QueryDefinition,
} from '@reduxjs/toolkit/query'
import type {
  UseInfiniteQuery,
  UseLazyQuery,
  UseMutation,
  UseQuery,
} from './buildHooks'

type QueryHookNames<EndpointDefinitionsType extends EndpointDefinitions> = {
  [K in keyof EndpointDefinitionsType as EndpointDefinitionsType[K] extends {
    type: DefinitionType.query
  }
    ? `use${Capitalize<K & string>}Query`
    : never]: UseQuery<
    Extract<EndpointDefinitionsType[K], QueryDefinition<any, any, any, any>>
  >
}

type LazyQueryHookNames<EndpointDefinitionsType extends EndpointDefinitions> = {
  [K in keyof EndpointDefinitionsType as EndpointDefinitionsType[K] extends {
    type: DefinitionType.query
  }
    ? `useLazy${Capitalize<K & string>}Query`
    : never]: UseLazyQuery<
    Extract<EndpointDefinitionsType[K], QueryDefinition<any, any, any, any>>
  >
}

type InfiniteQueryHookNames<
  EndpointDefinitionsType extends EndpointDefinitions,
> = {
  [K in keyof EndpointDefinitionsType as EndpointDefinitionsType[K] extends {
    type: DefinitionType.infinitequery
  }
    ? `use${Capitalize<K & string>}InfiniteQuery`
    : never]: UseInfiniteQuery<
    Extract<
      EndpointDefinitionsType[K],
      InfiniteQueryDefinition<any, any, any, any, any>
    >
  >
}

type MutationHookNames<EndpointDefinitionsType extends EndpointDefinitions> = {
  [K in keyof EndpointDefinitionsType as EndpointDefinitionsType[K] extends {
    type: DefinitionType.mutation
  }
    ? `use${Capitalize<K & string>}Mutation`
    : never]: UseMutation<
    Extract<EndpointDefinitionsType[K], MutationDefinition<any, any, any, any>>
  >
}

export type HooksWithUniqueNames<
  EndpointDefinitionsType extends EndpointDefinitions,
> = QueryHookNames<EndpointDefinitionsType> &
  LazyQueryHookNames<EndpointDefinitionsType> &
  InfiniteQueryHookNames<EndpointDefinitionsType> &
  MutationHookNames<EndpointDefinitionsType>
