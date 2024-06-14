// This must remain here so that the `mangleErrors.cjs` build script
// does not have to import this into each source file it rewrites.
// import { formatProdErrorMessage } from '@reduxjs/toolkit'
// export { formatProdErrorMessage }

import { buildCreateApi, coreModule } from '@reduxjs/toolkit/query'
import { reactHooksModule } from './module'
export { reactHooksModuleName } from './module'

export * from '@reduxjs/toolkit/query'
export { ApiProvider } from './ApiProvider'

const createApi = /* @__PURE__ */ buildCreateApi(
  coreModule(),
  reactHooksModule(),
)

export type {
  Api,
  ApiModules,
  CoreModule,
  CreateApi,
} from '@reduxjs/toolkit/query'
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
export { UNINITIALIZED_VALUE } from './constants'
export { createApi, reactHooksModule }
// export { coreModuleName, createApi, reactHooksModule, reactHooksModuleName }
