import { buildCreateApi } from '../createApi'
import { coreModule } from './module'

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
  StartQueryActionCreatorOptions,
} from './buildInitiate'
export type { SubscriptionSelectors } from './buildMiddleware'
export { skipToken } from './buildSelectors'
export type {
  MutationResultSelectorResult,
  QueryResultSelectorResult,
  SkipToken,
} from './buildSelectors'
export { coreModuleName } from './module'
export type {
  ApiEndpointMutation,
  ApiEndpointQuery,
  CoreModule,
  PrefetchOptions,
} from './module'
export { setupListeners } from './setupListeners'
export { buildCreateApi, coreModule }
