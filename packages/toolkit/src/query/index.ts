// This must remain here so that the `mangleErrors.cjs` build script
// does not have to import this into each source file it rewrites.
import { formatProdErrorMessage } from '@reduxjs/toolkit'
export { formatProdErrorMessage }

export type { Api, ApiContext, ApiModules, Module } from './apiTypes'
export type {
  BaseQueryApi,
  BaseQueryEnhancer,
  BaseQueryFn,
} from './baseQueryTypes'
export {
  coreModule,
  coreModuleName,
  createApi,
  QueryStatus,
  setupListeners,
  skipToken,
} from './core'
export type {
  ApiEndpointMutation,
  ApiEndpointQuery,
  CombinedState,
  CoreModule,
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
  SubscriptionOptions,
} from './core'
export { buildCreateApi } from './createApi'
export type { CreateApi, CreateApiOptions } from './createApi'
export { defaultSerializeQueryArgs } from './defaultSerializeQueryArgs'
export type { SerializeQueryArgs } from './defaultSerializeQueryArgs'
export type {
  DefinitionsFromApi,
  DefinitionType,
  EndpointBuilder,
  EndpointDefinition,
  EndpointDefinitions,
  MutationDefinition,
  OverrideResultType,
  QueryArgFrom,
  QueryDefinition,
  ResultTypeFrom,
  TagDescription,
  TagTypesFromApi,
} from './endpointDefinitions'
export { fakeBaseQuery } from './fakeBaseQuery'
export { fetchBaseQuery } from './fetchBaseQuery'
export type {
  FetchArgs,
  FetchBaseQueryError,
  FetchBaseQueryMeta,
} from './fetchBaseQuery'
export { retry } from './retry'
export { safeAssign } from './tsHelpers'
export type {
  Id as TSHelpersId,
  NoInfer as TSHelpersNoInfer,
  Override as TSHelpersOverride,
} from './tsHelpers'
export { copyWithStructuralSharing } from './utils'
