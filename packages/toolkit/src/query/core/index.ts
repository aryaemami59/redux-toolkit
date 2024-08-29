import { buildCreateApi } from '../createApi'
import { coreModule } from './module'

export const createApi = /* @__PURE__ */ buildCreateApi(coreModule())

export { buildCreateApi } from '../createApi'
export type { CreateApi, CreateApiOptions } from '../createApi'
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
} from './buildMiddleware/index'
export { skipToken } from './buildSelectors'
export type {
  MutationResultSelectorResult,
  QueryResultSelectorResult,
  SkipToken,
} from './buildSelectors'
export type {
  NormalizedQueryUpsertEntryPayload,
  ProcessedQueryUpsertEntry,
  UpsertEntries,
} from './buildSlice'
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
  InternalActions,
  PrefetchOptions,
  ThunkWithReturnValue,
} from './module'
export { setupListeners } from './setupListeners'
