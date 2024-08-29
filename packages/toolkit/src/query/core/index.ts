import { buildCreateApi } from '../createApi'
import { coreModule } from './module'

export const createApi = /* @__PURE__ */ buildCreateApi(coreModule())

export { buildCreateApi } from '../createApi'
export { QueryStatus } from './apiState'
export type {
  CombinedState,
  MutationKeys,
  MutationSubstateIdentifier,
  QueryCacheKey,
  QueryKeys,
  QuerySubState,
  QuerySubstateIdentifier,
  RootState,
  SubscriptionOptions,
} from './apiState'
export type {
  MutationActionCreatorResult,
  QueryActionCreatorResult,
  StartQueryActionCreatorOptions,
} from './buildInitiate'
export type {
  MutationCacheLifecycleApi,
  MutationLifecycleApi,
  QueryCacheLifecycleApi,
  QueryLifecycleApi,
  SubscriptionSelectors,
} from './buildMiddleware/index'
export { skipToken } from './buildSelectors'
export type {
  MutationResultSelectorResult,
  QueryResultSelectorResult,
  SkipToken,
} from './buildSelectors'
export type { SliceActions } from './buildSlice'
export type {
  PatchQueryDataThunk,
  UpdateQueryDataThunk,
  UpsertQueryDataThunk,
} from './buildThunks'
export { coreModule, coreModuleName } from './module'
export type {
  ApiEndpointMutation,
  ApiEndpointQuery,
  ApiModules,
  CoreModule,
  PrefetchOptions,
} from './module'
export { setupListeners } from './setupListeners'
