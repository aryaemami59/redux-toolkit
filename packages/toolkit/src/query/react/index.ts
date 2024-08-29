// This must remain here so that the `mangleErrors.cjs` build script
// does not have to import this into each source file it rewrites.

import { buildCreateApi, coreModule } from '@reduxjs/toolkit/query'
import { reactHooksModule } from './module'

export const createApi = /* @__PURE__ */ buildCreateApi(
  coreModule(),
  reactHooksModule(),
)

export * from '@reduxjs/toolkit/query'
export { ApiProvider } from './ApiProvider'
export type {
  MutationHooks,
  QueryHooks,
  TypedLazyQueryTrigger,
  TypedMutationTrigger,
  TypedQueryStateSelector,
  TypedUseLazyQuery,
  TypedUseLazyQuerySubscription,
  TypedUseMutation,
  TypedUseMutationResult,
  TypedUseQuery,
  TypedUseQueryHookResult,
  TypedUseQueryState,
  TypedUseQueryStateOptions,
  TypedUseQueryStateResult,
  TypedUseQuerySubscription,
  TypedUseQuerySubscriptionResult,
  UseLazyQuery,
  UseMutation,
  UseQuery,
  UseQueryState,
} from './buildHooks'
export { UNINITIALIZED_VALUE } from './constants'
export { reactHooksModule, reactHooksModuleName } from './module'
