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

type QueryHookNames<DefinitionsType extends EndpointDefinitions> = {
  [K in keyof DefinitionsType as DefinitionsType[K] extends {
    type: DefinitionType.query
  }
    ? `use${Capitalize<K & string>}Query`
    : never]: UseQuery<
    Extract<DefinitionsType[K], QueryDefinition<any, any, any, any>>
  >
}

type LazyQueryHookNames<DefinitionsType extends EndpointDefinitions> = {
  [K in keyof DefinitionsType as DefinitionsType[K] extends {
    type: DefinitionType.query
  }
    ? `useLazy${Capitalize<K & string>}Query`
    : never]: UseLazyQuery<
    Extract<DefinitionsType[K], QueryDefinition<any, any, any, any>>
  >
}

type InfiniteQueryHookNames<DefinitionsType extends EndpointDefinitions> = {
  [K in keyof DefinitionsType as DefinitionsType[K] extends {
    type: DefinitionType.infinitequery
  }
    ? `use${Capitalize<K & string>}InfiniteQuery`
    : never]: UseInfiniteQuery<
    Extract<
      DefinitionsType[K],
      InfiniteQueryDefinition<any, any, any, any, any>
    >
  >
}

type MutationHookNames<DefinitionsType extends EndpointDefinitions> = {
  [K in keyof DefinitionsType as DefinitionsType[K] extends {
    type: DefinitionType.mutation
  }
    ? `use${Capitalize<K & string>}Mutation`
    : never]: UseMutation<
    Extract<DefinitionsType[K], MutationDefinition<any, any, any, any>>
  >
}

export type HooksWithUniqueNames<DefinitionsType extends EndpointDefinitions> =
  QueryHookNames<DefinitionsType> &
    LazyQueryHookNames<DefinitionsType> &
    InfiniteQueryHookNames<DefinitionsType> &
    MutationHookNames<DefinitionsType>
