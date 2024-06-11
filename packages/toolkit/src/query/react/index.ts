// This must remain here so that the `mangleErrors.cjs` build script
// does not have to import this into each source file it rewrites.
import { formatProdErrorMessage } from '@reduxjs/toolkit'
export { formatProdErrorMessage }

// import type { CreateApi } from '@reduxjs/toolkit/query'
import {
  buildCreateApi,
  coreModule,
  // coreModuleName,
} from '@reduxjs/toolkit/query'
import { reactHooksModule, reactHooksModuleName } from './module'

// export type * from '@reduxjs/toolkit/query'
export * from '@reduxjs/toolkit/query'
export { ApiProvider } from './ApiProvider'

const createApi = /* @__PURE__ */ buildCreateApi(
  coreModule(),
  reactHooksModule(),
)

export type {
  QueryHooks,
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
  UseLazyQuery,
  UseQuery,
} from './buildHooks'
export { createApi, reactHooksModule, reactHooksModuleName }
// export { coreModuleName, createApi, reactHooksModule, reactHooksModuleName }
export type { CreateApi } from '@reduxjs/toolkit/query'
