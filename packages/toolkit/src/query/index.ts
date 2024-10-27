// This must remain here so that the `mangleErrors.cjs` build script
// does not have to import this into each source file it rewrites.

export type { Api, ApiContext, Module } from './apiTypes'
export type {
  BaseQueryApi,
  BaseQueryArg,
  BaseQueryEnhancer,
  BaseQueryError,
  BaseQueryExtraOptions,
  BaseQueryFn,
  BaseQueryMeta,
  BaseQueryResult,
  QueryReturnValue,
} from './baseQueryTypes'
export {
  QueryStatus,
  coreModule,
  coreModuleName,
  createApi,
  setupListeners,
  skipToken,
} from './core/index'
export type {
  ApiEndpointInfiniteQuery,
  ApiEndpointMutation,
  ApiEndpointQuery,
  CombinedState,
  CoreModule,
  InfiniteData,
  InfiniteQueryActionCreatorResult,
  InfiniteQueryConfigOptions,
  InfiniteQueryResultSelectorResult,
  MutationActionCreatorResult,
  MutationResultSelectorResult,
  PrefetchOptions,
  QueryActionCreatorResult,
  QueryCacheKey,
  QueryKeys,
  QueryResultSelectorResult,
  QuerySubState,
  RootState,
  SkipToken,
  StartQueryActionCreatorOptions,
  SubscriptionOptions,
} from './core/index'
export type { ApiModules } from './core/module'
export { buildCreateApi } from './createApi'
export type { CreateApi, CreateApiOptions } from './createApi'
export { defaultSerializeQueryArgs } from './defaultSerializeQueryArgs'
export type { SerializeQueryArgs } from './defaultSerializeQueryArgs'
export type {
  BaseEndpointDefinition,
  DefinitionType,
  DefinitionsFromApi,
  EndpointBuilder,
  EndpointDefinition,
  EndpointDefinitions,
  InfiniteQueryArgFrom,
  InfiniteQueryDefinition,
  InfiniteQueryExtraOptions,
  MutationDefinition,
  MutationExtraOptions,
  OverrideResultType,
  PageParamFrom,
  QueryArgFrom,
  QueryDefinition,
  QueryExtraOptions,
  ResultDescription,
  ResultTypeFrom,
  TagDescription,
  TagTypesFromApi,
  UpdateDefinitions,
} from './endpointDefinitions'
export { _NEVER, fakeBaseQuery } from './fakeBaseQuery'
export { fetchBaseQuery } from './fetchBaseQuery'
export type {
  FetchArgs,
  FetchBaseQueryArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from './fetchBaseQuery'
export { retry } from './retry'
export type { RetryOptions } from './retry'
export type {
  Id as TSHelpersId,
  NoInfer as TSHelpersNoInfer,
  Override as TSHelpersOverride,
} from './tsHelpers'
export { copyWithStructuralSharing } from './utils/copyWithStructuralSharing'
