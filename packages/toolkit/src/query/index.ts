// This must remain here so that the `mangleErrors.cjs` build script
// does not have to import this into each source file it rewrites.

export type { Api, ApiContext, Module } from './apiTypes'
export type {
  BaseQueryApi,
  BaseQueryEnhancer,
  BaseQueryFn,
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
  ApiEndpointMutation,
  ApiEndpointQuery,
  ApiModules,
  CombinedState,
  CoreModule,
  MutationActionCreatorResult,
  MutationKeys,
  MutationResultSelectorResult,
  MutationSubstateIdentifier,
  PatchQueryDataThunk,
  PrefetchOptions,
  QueryActionCreatorResult,
  QueryCacheKey,
  QueryKeys,
  QueryResultSelectorResult,
  QuerySubState,
  QuerySubstateIdentifier,
  RootState,
  SkipToken,
  StartQueryActionCreatorOptions,
  SubscriptionOptions,
  UpdateQueryDataThunk,
  UpsertQueryDataThunk,
} from './core/index'
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
  FullTagDescription,
  MutationDefinition,
  MutationExtraOptions,
  OverrideResultType,
  QueryArgFrom,
  QueryDefinition,
  QueryExtraOptions,
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
  // CastAny,
  // HasRequiredProps,
  MaybePromise,
  NonUndefined,
  OmitFromUnion,
  Id as TSHelpersId,
  NoInfer as TSHelpersNoInfer,
  Override as TSHelpersOverride,
  UnionToIntersection,
  UnwrapPromise,
  WithRequiredProp,
} from './tsHelpers'
export { copyWithStructuralSharing } from './utils/index'
