// This must remain here so that the `mangleErrors.cjs` build script
// does not have to import this into each source file it rewrites.

import {
  BaseQueryFn,
  buildCreateApi,
  coreModule,
  EndpointDefinitions,
  MutationDefinition,
  PrefetchOptions,
  QueryArgFrom,
  QueryDefinition,
  QueryKeys,
} from '@reduxjs/toolkit/query'
import { MutationHooks, QueryHooks } from './buildHooks'
import { reactHooksModule, reactHooksModuleName } from './module'
import { HooksWithUniqueNames } from './namedHooks'
export * from '@reduxjs/toolkit/query'
export { ApiProvider } from './ApiProvider'

const createApi = /* @__PURE__ */ buildCreateApi(
  coreModule(),
  reactHooksModule(),
)

export type {
  TypedLazyQueryTrigger,
  TypedMutationTrigger,
  TypedUseLazyQuery,
  TypedUseLazyQuerySubscription,
  TypedUseMutation,
  TypedUseMutationResult,
  TypedUseQuery,
  TypedUseQueryHookResult,
  TypedUseQueryState,
  TypedUseQueryStateResult,
  TypedUseQuerySubscription,
  TypedUseQuerySubscriptionResult,
} from './buildHooks'
export { createApi, reactHooksModule, reactHooksModuleName }

declare module '@reduxjs/toolkit/query' {
  export interface ApiModules<
    BaseQuery extends BaseQueryFn,
    Definitions extends EndpointDefinitions,
    ReducerPath extends string,
    TagTypes extends string,
  > {
    [reactHooksModuleName]: {
      /**
       *  Endpoints based on the input endpoints provided to `createApi`, containing `select`, `hooks` and `action matchers`.
       */
      endpoints: {
        [K in keyof Definitions]: Definitions[K] extends QueryDefinition<
          any,
          any,
          any,
          any,
          any
        >
          ? QueryHooks<Definitions[K]>
          : Definitions[K] extends MutationDefinition<any, any, any, any, any>
            ? MutationHooks<Definitions[K]>
            : never
      }
      /**
       * A hook that accepts a string endpoint name, and provides a callback that when called, pre-fetches the data for that endpoint.
       */
      usePrefetch<EndpointName extends QueryKeys<Definitions>>(
        endpointName: EndpointName,
        options?: PrefetchOptions,
      ): (
        arg: QueryArgFrom<Definitions[EndpointName]>,
        options?: PrefetchOptions,
      ) => void
    } & HooksWithUniqueNames<Definitions>
  }
}
