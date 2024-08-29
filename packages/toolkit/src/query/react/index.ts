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
  TypedUseQueryStateOptions,
} from './buildHooks'
export { UNINITIALIZED_VALUE } from './constants'
export { reactHooksModule, reactHooksModuleName } from './module'
