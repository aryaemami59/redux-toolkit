import type { CreateApiOptions } from '../createApi'
import { buildCreateApi } from '../createApi'
import type {
  ApiEndpointMutation,
  ApiEndpointQuery,
  CoreModule,
  // CoreModuleOptions,
  // InternalActions,
  // ListenerActions,
  // MutationResultSelectorFactory,
  PrefetchOptions,
} from './module'
import { coreModule, coreModuleName } from './module'
// import { coreModule } from './module'

export const createApi = /* @__PURE__ */ buildCreateApi(coreModule())

export { QueryStatus } from './apiState'
export type {
  CombinedState,
  QueryCacheKey,
  QueryKeys,
  QuerySubState,
  RootState,
  SubscriptionOptions,
} from './apiState'
export type {
  MutationActionCreatorResult,
  QueryActionCreatorResult,
} from './buildInitiate'
export { skipToken } from './buildSelectors'
export type {
  MutationResultSelectorResult,
  QueryResultSelectorResult,
  SkipToken,
} from './buildSelectors'
export { coreModuleName }
// export { coreModuleName } from './module'
// export type {
//   ApiEndpointMutation,
//   ApiEndpointQuery,
//   CoreModule,
//   PrefetchOptions,
// } from './module'
export { setupListeners } from './setupListeners'
export { buildCreateApi, coreModule }
export type {
  ApiEndpointMutation,
  ApiEndpointQuery,
  CoreModule,
  // CoreModuleOptions,
  // CreateApi,
  CreateApiOptions,
  // InternalActions,
  // ListenerActions,
  // MutationResultSelectorFactory,
  PrefetchOptions,
}
