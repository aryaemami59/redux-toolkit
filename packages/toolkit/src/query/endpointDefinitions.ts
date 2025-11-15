import type { Api } from '@reduxjs/toolkit/query'
import type { StandardSchemaV1 } from '@standard-schema/spec'
import type {
  BaseQueryApi,
  BaseQueryArg,
  BaseQueryError,
  BaseQueryExtraOptions,
  BaseQueryFn,
  BaseQueryMeta,
  BaseQueryResult,
  QueryReturnValue,
} from './baseQueryTypes'
import type { CacheCollectionQueryExtraOptions } from './core/buildMiddleware/cacheCollection'
import type {
  CacheLifecycleInfiniteQueryExtraOptions,
  CacheLifecycleMutationExtraOptions,
  CacheLifecycleQueryExtraOptions,
} from './core/buildMiddleware/cacheLifecycle'
import type {
  QueryLifecycleInfiniteQueryExtraOptions,
  QueryLifecycleMutationExtraOptions,
  QueryLifecycleQueryExtraOptions,
} from './core/buildMiddleware/queryLifecycle'
import type {
  InfiniteData,
  InfiniteQueryConfigOptions,
  QuerySubState,
  RootState,
} from './core/index'
import type { SerializeQueryArgs } from './defaultSerializeQueryArgs'
import type { NEVER } from './fakeBaseQuery'
import type { NamedSchemaError } from './standardSchema'
import type {
  CastAny,
  HasRequiredProps,
  MaybePromise,
  NonUndefined,
  OmitFromUnion,
  UnwrapPromise,
} from './tsHelpers'
import { isNotNullish } from './utils'
import { filterMap } from './utils/filterMap'

const rawResultType = /* @__PURE__ */ Symbol()
const resultType = /* @__PURE__ */ Symbol()
const baseQuery = /* @__PURE__ */ Symbol()

export interface SchemaFailureInfo {
  endpoint: string
  arg: any
  type: 'query' | 'mutation'
  queryCacheKey?: string
}

export type SchemaFailureHandler = (
  error: NamedSchemaError,
  info: SchemaFailureInfo,
) => void

export type SchemaFailureConverter<BaseQueryFunctionType extends BaseQueryFn> =
  (
    error: NamedSchemaError,
    info: SchemaFailureInfo,
  ) => BaseQueryError<BaseQueryFunctionType>

export type EndpointDefinitionWithQuery<
  QueryArgumentType,
  BaseQueryFunctionType extends BaseQueryFn,
  ResultType,
  RawResultType extends BaseQueryResult<BaseQueryFunctionType>,
> = {
  /**
   * `query` can be a function that returns either a `string` or an `object` which is passed to your `baseQuery`. If you are using [fetchBaseQuery](./fetchBaseQuery), this can return either a `string` or an `object` of properties in `FetchArgs`. If you use your own custom [`baseQuery`](../../rtk-query/usage/customizing-queries), you can customize this behavior to your liking.
   *
   * @example
   *
   * ```ts
   * // codeblock-meta title="query example"
   *
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
   *
   * interface Post {
   *   id: number;
   *   name: string;
   * }
   *
   * type PostsResponse = Post[];
   *
   * const api = createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   tagTypes: ['Post'],
   *   endpoints: (build) => ({
   *     getPosts: build.query<PostsResponse, void>({
   *       // highlight-start
   *       query: () => 'posts',
   *       // highlight-end
   *     }),
   *     addPost: build.mutation<Post, Partial<Post>>({
   *       // highlight-start
   *       query: (body) => ({
   *         url: `posts`,
   *         method: 'POST',
   *         body,
   *       }),
   *       // highlight-end
   *       invalidatesTags: [{ type: 'Post', id: 'LIST' }],
   *     }),
   *   }),
   * });
   * ```
   */
  query(arg: QueryArgumentType): BaseQueryArg<BaseQueryFunctionType>
  queryFn?: never
  /**
   * A function to manipulate the data returned by a query or mutation.
   */
  transformResponse?(
    baseQueryReturnValue: RawResultType,
    meta: BaseQueryMeta<BaseQueryFunctionType>,
    arg: QueryArgumentType,
  ): ResultType | Promise<ResultType>
  /**
   * A function to manipulate the data returned by a failed query or mutation.
   */
  transformErrorResponse?(
    baseQueryReturnValue: BaseQueryError<BaseQueryFunctionType>,
    meta: BaseQueryMeta<BaseQueryFunctionType>,
    arg: QueryArgumentType,
  ): unknown

  /**
   * A schema for the result *before* it's passed to `transformResponse`.
   *
   * @example
   * ```ts
   * // codeblock-meta no-transpile
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
   * import * as v from 'valibot';
   *
   * const postSchema = v.object({ id: v.number(), name: v.string() });
   * type Post = v.InferOutput<typeof postSchema>;
   *
   * const api = createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   endpoints: (build) => ({
   *     getPostName: build.query<Post, { id: number }>({
   *       query: ({ id }) => `/post/${id}`,
   *       rawResponseSchema: postSchema,
   *       transformResponse: (post) => post.name,
   *     }),
   *   }),
   * });
   * ```
   */
  rawResponseSchema?: StandardSchemaV1<RawResultType>

  /**
   * A schema for the error object returned by the `query` or `queryFn`, *before* it's passed to `transformErrorResponse`.
   *
   * @example
   * ```ts
   * // codeblock-meta no-transpile
   * import { createApi } from '@reduxjs/toolkit/query/react';
   * import { baseQueryErrorSchema, customBaseQuery } from './customBaseQuery';
   *
   * interface Post {
   *   id: number;
   *   name: string;
   * }
   *
   * const api = createApi({
   *   baseQuery: customBaseQuery,
   *   endpoints: (build) => ({
   *     getPost: build.query<Post, { id: number }>({
   *       query: ({ id }) => `/post/${id}`,
   *       rawErrorResponseSchema: baseQueryErrorSchema,
   *       transformErrorResponse: (error) => error.data,
   *     }),
   *   }),
   * });
   * ```
   */
  rawErrorResponseSchema?: StandardSchemaV1<
    BaseQueryError<BaseQueryFunctionType>
  >
}

export type EndpointDefinitionWithQueryFn<
  QueryArgumentType,
  BaseQueryFunctionType extends BaseQueryFn,
  ResultType,
> = {
  /**
   * Can be used in place of `query` as an inline function that bypasses `baseQuery` completely for the endpoint.
   *
   * @example
   * ```ts
   * // codeblock-meta title="Basic queryFn example"
   *
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
   *
   * interface Post {
   *   id: number;
   *   name: string;
   * }
   *
   * type PostsResponse = Post[];
   *
   * const api = createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   endpoints: (build) => ({
   *     getPosts: build.query<PostsResponse, void>({
   *       query: () => 'posts',
   *     }),
   *     flipCoin: build.query<'heads' | 'tails', void>({
   *       // highlight-start
   *       queryFn(arg, queryApi, extraOptions, baseQuery) {
   *         const randomVal = Math.random();
   *         if (randomVal < 0.45) {
   *           return { data: 'heads' };
   *         }
   *         if (randomVal < 0.9) {
   *           return { data: 'tails' };
   *         }
   *         return {
   *           error: {
   *             status: 500,
   *             statusText: 'Internal Server Error',
   *             data: 'Coin landed on its edge!',
   *           },
   *         };
   *       },
   *       // highlight-end
   *     }),
   *   }),
   * });
   * ```
   */
  queryFn(
    arg: QueryArgumentType,
    api: BaseQueryApi,
    extraOptions: BaseQueryExtraOptions<BaseQueryFunctionType>,
    baseQueryFunction: (
      arg: Parameters<BaseQueryFunctionType>[0],
    ) => ReturnType<BaseQueryFunctionType>,
  ): MaybePromise<
    QueryReturnValue<
      ResultType,
      BaseQueryError<BaseQueryFunctionType>,
      BaseQueryMeta<BaseQueryFunctionType>
    >
  >
  query?: never
  transformResponse?: never
  transformErrorResponse?: never
  rawResponseSchema?: never
  rawErrorResponseSchema?: never
}

type BaseEndpointTypes<
  QueryArgumentType,
  BaseQueryFunctionType extends BaseQueryFn,
  ResultType,
  RawResultType,
> = {
  QueryArg: QueryArgumentType
  BaseQuery: BaseQueryFunctionType
  ResultType: ResultType
  RawResultType: RawResultType
}

export type SchemaType =
  | 'arg'
  | 'rawResponse'
  | 'response'
  | 'rawErrorResponse'
  | 'errorResponse'
  | 'meta'

interface CommonEndpointDefinition<
  QueryArgumentType,
  BaseQueryFunctionType extends BaseQueryFn,
  ResultType,
> {
  /**
   * A schema for the arguments to be passed to the `query` or `queryFn`.
   *
   * @example
   * ```ts
   * // codeblock-meta no-transpile
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
   * import * as v from 'valibot';
   *
   * interface Post {
   *   id: number;
   *   name: string;
   * }
   *
   * const api = createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   endpoints: (build) => ({
   *     getPost: build.query<Post, { id: number }>({
   *       query: ({ id }) => `/post/${id}`,
   *       argSchema: v.object({ id: v.number() }),
   *     }),
   *   }),
   * });
   * ```
   */
  argSchema?: StandardSchemaV1<QueryArgumentType>

  /**
   * A schema for the result (including `transformResponse` if provided).
   *
   * @example
   * ```ts
   * // codeblock-meta no-transpile
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
   * import * as v from 'valibot';
   *
   * const postSchema = v.object({ id: v.number(), name: v.string() });
   * type Post = v.InferOutput<typeof postSchema>;
   *
   * const api = createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   endpoints: (build) => ({
   *     getPost: build.query<Post, { id: number }>({
   *       query: ({ id }) => `/post/${id}`,
   *       responseSchema: postSchema,
   *     }),
   *   }),
   * });
   * ```
   */
  responseSchema?: StandardSchemaV1<ResultType>

  /**
   * A schema for the error object returned by the `query` or `queryFn` (including `transformErrorResponse` if provided).
   *
   * @example
   * ```ts
   * // codeblock-meta no-transpile
   * import { createApi } from '@reduxjs/toolkit/query/react';
   * import { baseQueryErrorSchema, customBaseQuery } from './customBaseQuery';
   *
   * interface Post {
   *   id: number;
   *   name: string;
   * }
   *
   * const api = createApi({
   *   baseQuery: customBaseQuery,
   *   endpoints: (build) => ({
   *     getPost: build.query<Post, { id: number }>({
   *       query: ({ id }) => `/post/${id}`,
   *       errorResponseSchema: baseQueryErrorSchema,
   *     }),
   *   }),
   * });
   * ```
   */
  errorResponseSchema?: StandardSchemaV1<BaseQueryError<BaseQueryFunctionType>>

  /**
   * A schema for the `meta` property returned by the `query` or `queryFn`.
   *
   * @example
   * ```ts
   * // codeblock-meta no-transpile
   * import { createApi } from '@reduxjs/toolkit/query/react';
   * import { baseQueryMetaSchema, customBaseQuery } from './customBaseQuery';
   *
   * interface Post {
   *   id: number;
   *   name: string;
   * }
   *
   * const api = createApi({
   *   baseQuery: customBaseQuery,
   *   endpoints: (build) => ({
   *     getPost: build.query<Post, { id: number }>({
   *       query: ({ id }) => `/post/${id}`,
   *       metaSchema: baseQueryMetaSchema,
   *     }),
   *   }),
   * });
   * ```
   */
  metaSchema?: StandardSchemaV1<BaseQueryMeta<BaseQueryFunctionType>>

  /**
   * Most apps should leave this setting on. The only time it can be a performance issue
   * is if an API returns extremely large amounts of data (e.g. 10,000 rows per request) and
   * you're unable to paginate it.
   *
   * For details of how this works, please see the below. When it is set to `false`,
   * every request will cause subscribed components to rerender, even when the data has not changed.
   *
   * @default true
   *
   * @see https://redux-toolkit.js.org/api/other-exports#copywithstructuralsharing
   */
  structuralSharing?: boolean

  /**
   * A function that is called when a schema validation fails.
   *
   * Gets called with a `NamedSchemaError` and an object containing the endpoint name, the type of the endpoint, the argument passed to the endpoint, and the query cache key (if applicable).
   *
   * `NamedSchemaError` has the following properties:
   * - `issues`: an array of issues that caused the validation to fail
   * - `value`: the value that was passed to the schema
   * - `schemaName`: the name of the schema that was used to validate the value (e.g. `argSchema`)
   *
   * @example
   * ```ts
   * // codeblock-meta no-transpile
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
   *
   * interface Post {
   *   id: number;
   *   name: string;
   * }
   *
   * const api = createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   endpoints: (build) => ({
   *     getPost: build.query<Post, { id: number }>({
   *       query: ({ id }) => `/post/${id}`,
   *       onSchemaFailure: (error, info) => {
   *         console.error(error, info);
   *       },
   *     }),
   *   }),
   * });
   * ```
   */
  onSchemaFailure?: SchemaFailureHandler

  /**
   * Convert a schema validation failure into an error shape matching base query errors.
   *
   * When not provided, schema failures are treated as fatal, and normal error handling such as tag invalidation will not be executed.
   *
   * @example
   * ```ts
   * // codeblock-meta no-transpile
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
   * import * as v from 'valibot';
   *
   * interface Post {
   *   id: number;
   *   name: string;
   * }
   *
   * const api = createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   endpoints: (build) => ({
   *     getPost: build.query<Post, { id: number }>({
   *       query: ({ id }) => `/post/${id}`,
   *       responseSchema: v.object({ id: v.number(), name: v.string() }),
   *       catchSchemaFailure: (error, info) => ({
   *         status: 'CUSTOM_ERROR',
   *         error: `${error.schemaName} failed validation`,
   *         data: error.issues,
   *       }),
   *     }),
   *   }),
   * });
   * ```
   */
  catchSchemaFailure?: SchemaFailureConverter<BaseQueryFunctionType>

  /**
   * If set to `true`, will skip schema validation for this endpoint.
   * Overrides the global setting.
   *
   * Can be overridden for specific schemas by passing an array of schema types to skip.
   *
   * @example
   * ```ts
   * // codeblock-meta no-transpile
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
   * import * as v from 'valibot';
   *
   * interface Post {
   *   id: number;
   *   name: string;
   * }
   *
   * const api = createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   endpoints: (build) => ({
   *     getPost: build.query<Post, { id: number }>({
   *       query: ({ id }) => `/post/${id}`,
   *       responseSchema: v.object({ id: v.number(), name: v.string() }),
   *       skipSchemaValidation:
   *         process.env.NODE_ENV === 'test' ? ['response'] : false, // skip schema validation for response in tests, since we'll be mocking the response
   *     }),
   *   }),
   * });
   * ```
   *
   * @default false
   */
  skipSchemaValidation?: boolean | SchemaType[]
}

export type BaseEndpointDefinition<
  QueryArgumentType,
  BaseQuery extends BaseQueryFn,
  ResultType,
  RawResultType extends BaseQueryResult<BaseQuery> = BaseQueryResult<BaseQuery>,
> = (
  | ([CastAny<BaseQueryResult<BaseQuery>, {}>] extends [NEVER]
      ? never
      : EndpointDefinitionWithQuery<
          QueryArgumentType,
          BaseQuery,
          ResultType,
          RawResultType
        >)
  | EndpointDefinitionWithQueryFn<QueryArgumentType, BaseQuery, ResultType>
) &
  CommonEndpointDefinition<QueryArgumentType, BaseQuery, ResultType> & {
    /* phantom type */
    [rawResultType]?: RawResultType
    /* phantom type */
    [resultType]?: ResultType
    /* phantom type */
    [baseQuery]?: BaseQuery
  } & HasRequiredProps<
    BaseQueryExtraOptions<BaseQuery>,
    { extraOptions: BaseQueryExtraOptions<BaseQuery> },
    { extraOptions?: BaseQueryExtraOptions<BaseQuery> }
  >

// NOTE As with QueryStatus in `apiState.ts`, don't use this for real comparisons
// at runtime, use the string constants defined below.
export enum DefinitionType {
  query = 'query',
  mutation = 'mutation',
  infinitequery = 'infinitequery',
}

export const ENDPOINT_QUERY = DefinitionType.query
export const ENDPOINT_MUTATION = DefinitionType.mutation
export const ENDPOINT_INFINITEQUERY = DefinitionType.infinitequery

type TagDescriptionArray<TagTypes extends string> = ReadonlyArray<
  TagDescription<TagTypes> | undefined | null
>

export type GetResultDescriptionFn<
  TagTypes extends string,
  ResultType,
  QueryArgumentType,
  ErrorType,
  MetaType,
> = (
  result: ResultType | undefined,
  error: ErrorType | undefined,
  arg: QueryArgumentType,
  meta: MetaType,
) => TagDescriptionArray<TagTypes>

export type FullTagDescription<TagType> = {
  type: TagType
  id?: number | string
}
export type TagDescription<TagType> = TagType | FullTagDescription<TagType>

/**
 * @public
 */
export type ResultDescription<
  TagTypes extends string,
  ResultType,
  QueryArgumentType,
  ErrorType,
  MetaType,
> =
  | TagDescriptionArray<TagTypes>
  | GetResultDescriptionFn<
      TagTypes,
      ResultType,
      QueryArgumentType,
      ErrorType,
      MetaType
    >

type QueryTypes<
  QueryArgumentType,
  BaseQueryFunctionType extends BaseQueryFn,
  TagTypes extends string,
  ResultType,
  ReducerPath extends string = string,
  RawResultType extends
    BaseQueryResult<BaseQueryFunctionType> = BaseQueryResult<BaseQueryFunctionType>,
> = BaseEndpointTypes<
  QueryArgumentType,
  BaseQueryFunctionType,
  ResultType,
  RawResultType
> & {
  /**
   * The endpoint definition type. To be used with some internal generic types.
   * @example
   * ```ts
   * const useMyWrappedHook: UseQuery<typeof api.endpoints.query.Types.QueryDefinition> = ...
   * ```
   */
  QueryDefinition: QueryDefinition<
    QueryArgumentType,
    BaseQueryFunctionType,
    TagTypes,
    ResultType,
    ReducerPath
  >
  TagTypes: TagTypes
  ReducerPath: ReducerPath
}

/**
 * @public
 */
export interface QueryExtraOptions<
  TagTypes extends string,
  ResultType,
  QueryArgumentType,
  BaseQueryFunctionType extends BaseQueryFn,
  ReducerPath extends string = string,
  RawResultType extends
    BaseQueryResult<BaseQueryFunctionType> = BaseQueryResult<BaseQueryFunctionType>,
> extends CacheLifecycleQueryExtraOptions<
      ResultType,
      QueryArgumentType,
      BaseQueryFunctionType,
      ReducerPath
    >,
    QueryLifecycleQueryExtraOptions<
      ResultType,
      QueryArgumentType,
      BaseQueryFunctionType,
      ReducerPath
    >,
    CacheCollectionQueryExtraOptions {
  type: DefinitionType.query

  /**
   * Used by `query` endpoints. Determines which 'tag' is attached to the cached data returned by the query.
   * Expects an array of tag type strings, an array of objects of tag types with ids, or a function that returns such an array.
   * 1.  `['Post']` - equivalent to `2`
   * 2.  `[{ type: 'Post' }]` - equivalent to `1`
   * 3.  `[{ type: 'Post', id: 1 }]`
   * 4.  `(result, error, arg) => ['Post']` - equivalent to `5`
   * 5.  `(result, error, arg) => [{ type: 'Post' }]` - equivalent to `4`
   * 6.  `(result, error, arg) => [{ type: 'Post', id: 1 }]`
   *
   * @example
   *
   * ```ts
   * // codeblock-meta title="providesTags example"
   *
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
   *
   * interface Post {
   *   id: number;
   *   name: string;
   * }
   *
   * type PostsResponse = Post[];
   *
   * const api = createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   tagTypes: ['Posts'],
   *   endpoints: (build) => ({
   *     getPosts: build.query<PostsResponse, void>({
   *       query: () => 'posts',
   *       // highlight-start
   *       providesTags: (result) =>
   *         result
   *           ? [
   *               ...result.map(({ id }) => ({ type: 'Posts' as const, id })),
   *               { type: 'Posts', id: 'LIST' },
   *             ]
   *           : [{ type: 'Posts', id: 'LIST' }],
   *       // highlight-end
   *     }),
   *   }),
   * });
   * ```
   */
  providesTags?: ResultDescription<
    TagTypes,
    ResultType,
    QueryArgumentType,
    BaseQueryError<BaseQueryFunctionType>,
    BaseQueryMeta<BaseQueryFunctionType>
  >
  /**
   * Not to be used. A query should not invalidate tags in the cache.
   */
  invalidatesTags?: never

  /**
   * Can be provided to return a custom cache key value based on the query arguments.
   *
   * This is primarily intended for cases where a non-serializable value is passed as part of the query arg object and should be excluded from the cache key.  It may also be used for cases where an endpoint should only have a single cache entry, such as an infinite loading / pagination implementation.
   *
   * Unlike the `createApi` version which can _only_ return a string, this per-endpoint option can also return an an object, number, or boolean.  If it returns a string, that value will be used as the cache key directly.  If it returns an object / number / boolean, that value will be passed to the built-in `defaultSerializeQueryArgs`.  This simplifies the use case of stripping out args you don't want included in the cache key.
   *
   *
   * @example
   *
   * ```ts
   * // codeblock-meta title="serializeQueryArgs : exclude value"
   *
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
   *
   * interface Post {
   *   id: number;
   *   name: string;
   * }
   *
   * interface MyApiClient {
   *   fetchPost: (id: string) => Promise<Post>;
   * }
   *
   * createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   endpoints: (build) => ({
   *     // Example: an endpoint with an API client passed in as an argument,
   *     // but only the item ID should be used as the cache key
   *     getPost: build.query<Post, { id: string; client: MyApiClient }>({
   *       queryFn: async ({ id, client }) => {
   *         const post = await client.fetchPost(id);
   *         return { data: post };
   *       },
   *       // highlight-start
   *       serializeQueryArgs: ({ queryArgs, endpointDefinition, endpointName }) => {
   *         const { id } = queryArgs;
   *         // This can return a string, an object, a number, or a boolean.
   *         // If it returns an object, number or boolean, that value
   *         // will be serialized automatically via `defaultSerializeQueryArgs`
   *         return { id }; // omit `client` from the cache key
   *
   *         // Alternately, you can use `defaultSerializeQueryArgs` yourself:
   *         // return defaultSerializeQueryArgs({
   *         //   endpointName,
   *         //   queryArgs: { id },
   *         //   endpointDefinition
   *         // })
   *         // Or  create and return a string yourself:
   *         // return `getPost(${id})`
   *       },
   *       // highlight-end
   *     }),
   *   }),
   * });
   * ```
   */
  serializeQueryArgs?: SerializeQueryArgs<
    QueryArgumentType,
    string | number | boolean | Record<any, any>
  >

  /**
   * Can be provided to merge an incoming response value into the current cache data.
   * If supplied, no automatic structural sharing will be applied - it's up to
   * you to update the cache appropriately.
   *
   * Since RTKQ normally replaces cache entries with the new response, you will usually
   * need to use this with the `serializeQueryArgs` or `forceRefetch` options to keep
   * an existing cache entry so that it can be updated.
   *
   * Since this is wrapped with Immer, you may either mutate the `currentCacheValue` directly,
   * or return a new value, but _not_ both at once.
   *
   * Will only be called if the existing `currentCacheData` is _not_ `undefined` - on first response,
   * the cache entry will just save the response data directly.
   *
   * Useful if you don't want a new request to completely override the current cache value,
   * maybe because you have manually updated it from another source and don't want those
   * updates to get lost.
   *
   *
   * @example
   *
   * ```ts
   * // codeblock-meta title="merge: pagination"
   *
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
   *
   * interface Post {
   *   id: number;
   *   name: string;
   * }
   *
   * createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   endpoints: (build) => ({
   *     listItems: build.query<string[], number>({
   *       query: (pageNumber) => `/listItems?page=${pageNumber}`,
   *       // Only have one cache entry because the arg always maps to one string
   *       serializeQueryArgs: ({ endpointName }) => {
   *         return endpointName;
   *       },
   *       // Always merge incoming data to the cache entry
   *       merge: (currentCache, newItems) => {
   *         currentCache.push(...newItems);
   *       },
   *       // Refetch when the page arg changes
   *       forceRefetch({ currentArg, previousArg }) {
   *         return currentArg !== previousArg;
   *       },
   *     }),
   *   }),
   * });
   * ```
   */
  merge?(
    currentCacheData: ResultType,
    responseData: ResultType,
    otherArgs: {
      arg: QueryArgumentType
      baseQueryMeta: BaseQueryMeta<BaseQueryFunctionType>
      requestId: string
      fulfilledTimeStamp: number
    },
  ): ResultType | void

  /**
   * Check to see if the endpoint should force a refetch in cases where it normally wouldn't.
   * This is primarily useful for "infinite scroll" / pagination use cases where
   * RTKQ is keeping a single cache entry that is added to over time, in combination
   * with `serializeQueryArgs` returning a fixed cache key and a `merge` callback
   * set to add incoming data to the cache entry each time.
   *
   * @example
   *
   * ```ts
   * // codeblock-meta title="forceRefresh: pagination"
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
   *
   * interface Post {
   *   id: number;
   *   name: string;
   * }
   *
   * createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   endpoints: (build) => ({
   *     listItems: build.query<string[], number>({
   *       query: (pageNumber) => `/listItems?page=${pageNumber}`,
   *       // Only have one cache entry because the arg always maps to one string
   *       serializeQueryArgs: ({ endpointName }) => {
   *         return endpointName;
   *       },
   *       // Always merge incoming data to the cache entry
   *       merge: (currentCache, newItems) => {
   *         currentCache.push(...newItems);
   *       },
   *       // Refetch when the page arg changes
   *       forceRefetch({ currentArg, previousArg }) {
   *         return currentArg !== previousArg;
   *       },
   *     }),
   *   }),
   * });
   * ```
   */
  forceRefetch?(params: {
    currentArg: QueryArgumentType | undefined
    previousArg: QueryArgumentType | undefined
    state: RootState<any, any, string>
    endpointState?: QuerySubState<any>
  }): boolean

  /**
   * All of these are `undefined` at runtime, purely to be used in TypeScript declarations!
   */
  Types?: QueryTypes<
    QueryArgumentType,
    BaseQueryFunctionType,
    TagTypes,
    ResultType,
    ReducerPath,
    RawResultType
  >
}

export type QueryDefinition<
  QueryArgumentType,
  BaseQueryFunctionType extends BaseQueryFn,
  TagTypes extends string,
  ResultType,
  ReducerPath extends string = string,
  RawResultType extends
    BaseQueryResult<BaseQueryFunctionType> = BaseQueryResult<BaseQueryFunctionType>,
> = BaseEndpointDefinition<
  QueryArgumentType,
  BaseQueryFunctionType,
  ResultType,
  RawResultType
> &
  QueryExtraOptions<
    TagTypes,
    ResultType,
    QueryArgumentType,
    BaseQueryFunctionType,
    ReducerPath,
    RawResultType
  >

export type InfiniteQueryTypes<
  QueryArgumentType,
  PageParamType,
  BaseQueryFunctionType extends BaseQueryFn,
  TagTypes extends string,
  ResultType,
  ReducerPath extends string = string,
  RawResultType extends
    BaseQueryResult<BaseQueryFunctionType> = BaseQueryResult<BaseQueryFunctionType>,
> = BaseEndpointTypes<
  QueryArgumentType,
  BaseQueryFunctionType,
  ResultType,
  RawResultType
> & {
  /**
   * The endpoint definition type. To be used with some internal generic types.
   * @example
   * ```ts
   * const useMyWrappedHook: UseInfiniteQuery<typeof api.endpoints.query.Types.InfiniteQueryDefinition> = ...
   * ```
   */
  InfiniteQueryDefinition: InfiniteQueryDefinition<
    QueryArgumentType,
    PageParamType,
    BaseQueryFunctionType,
    TagTypes,
    ResultType,
    ReducerPath
  >
  TagTypes: TagTypes
  ReducerPath: ReducerPath
}

export interface InfiniteQueryExtraOptions<
  TagTypes extends string,
  ResultType,
  QueryArgumentType,
  PageParamType,
  BaseQueryFunctionType extends BaseQueryFn,
  ReducerPath extends string = string,
  RawResultType extends
    BaseQueryResult<BaseQueryFunctionType> = BaseQueryResult<BaseQueryFunctionType>,
> extends CacheLifecycleInfiniteQueryExtraOptions<
      InfiniteData<ResultType, PageParamType>,
      QueryArgumentType,
      BaseQueryFunctionType,
      ReducerPath
    >,
    QueryLifecycleInfiniteQueryExtraOptions<
      InfiniteData<ResultType, PageParamType>,
      QueryArgumentType,
      BaseQueryFunctionType,
      ReducerPath
    >,
    CacheCollectionQueryExtraOptions {
  type: DefinitionType.infinitequery

  providesTags?: ResultDescription<
    TagTypes,
    InfiniteData<ResultType, PageParamType>,
    QueryArgumentType,
    BaseQueryError<BaseQueryFunctionType>,
    BaseQueryMeta<BaseQueryFunctionType>
  >
  /**
   * Not to be used. A query should not invalidate tags in the cache.
   */
  invalidatesTags?: never

  /**
   * Required options to configure the infinite query behavior.
   * `initialPageParam` and `getNextPageParam` are required, to
   * ensure the infinite query can properly fetch the next page of data.
   * `initialPageParam` may be specified when using the
   * endpoint, to override the default value.
   * `maxPages` and `getPreviousPageParam` are both optional.
   *
   * @example
   *
   * ```ts
   * // codeblock-meta title="infiniteQueryOptions example"
   * import { createApi, fetchBaseQuery, defaultSerializeQueryArgs } from '@reduxjs/toolkit/query/react'
   *
   * type Pokemon = {
   *   id: string
   *   name: string
   * }
   *
   * const pokemonApi = createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: 'https://pokeapi.co/api/v2/' }),
   *   endpoints: (build) => ({
   *     getInfinitePokemonWithMax: build.infiniteQuery<Pokemon[], string, number>({
   *       infiniteQueryOptions: {
   *         initialPageParam: 0,
   *         maxPages: 3,
   *         getNextPageParam: (lastPage, allPages, lastPageParam, allPageParams) =>
   *           lastPageParam + 1,
   *         getPreviousPageParam: (
   *           firstPage,
   *           allPages,
   *           firstPageParam,
   *           allPageParams,
   *         ) => {
   *           return firstPageParam > 0 ? firstPageParam - 1 : undefined;
   *         },
   *       },
   *       query({ pageParam }) {
   *         return `https://example.com/listItems?page=${pageParam}`;
   *       },
   *     }),
   *   }),
   * })

   * ```
   */
  infiniteQueryOptions: InfiniteQueryConfigOptions<
    ResultType,
    PageParamType,
    QueryArgumentType
  >

  /**
   * Can be provided to return a custom cache key value based on the query arguments.
   *
   * This is primarily intended for cases where a non-serializable value is passed as part of the query arg object and should be excluded from the cache key.  It may also be used for cases where an endpoint should only have a single cache entry, such as an infinite loading / pagination implementation.
   *
   * Unlike the `createApi` version which can _only_ return a string, this per-endpoint option can also return an an object, number, or boolean.  If it returns a string, that value will be used as the cache key directly.  If it returns an object / number / boolean, that value will be passed to the built-in `defaultSerializeQueryArgs`.  This simplifies the use case of stripping out args you don't want included in the cache key.
   *
   *
   * @example
   *
   * ```ts
   * // codeblock-meta title="serializeQueryArgs : exclude value"
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
   *
   * interface Post {
   *   id: number;
   *   name: string;
   * }
   *
   * interface MyApiClient {
   *   fetchPost: (id: string) => Promise<Post>;
   * }
   *
   * createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   endpoints: (build) => ({
   *     // Example: an endpoint with an API client passed in as an argument,
   *     // but only the item ID should be used as the cache key
   *     getPost: build.query<Post, { id: string; client: MyApiClient }>({
   *       queryFn: async ({ id, client }) => {
   *         const post = await client.fetchPost(id);
   *         return { data: post };
   *       },
   *       // highlight-start
   *       serializeQueryArgs: ({ queryArgs, endpointDefinition, endpointName }) => {
   *         const { id } = queryArgs;
   *         // This can return a string, an object, a number, or a boolean.
   *         // If it returns an object, number or boolean, that value
   *         // will be serialized automatically via `defaultSerializeQueryArgs`
   *         return { id }; // omit `client` from the cache key
   *
   *         // Alternately, you can use `defaultSerializeQueryArgs` yourself:
   *         // return defaultSerializeQueryArgs({
   *         //   endpointName,
   *         //   queryArgs: { id },
   *         //   endpointDefinition
   *         // })
   *         // Or  create and return a string yourself:
   *         // return `getPost(${id})`
   *       },
   *       // highlight-end
   *     }),
   *   }),
   * });
   * ```
   */
  serializeQueryArgs?: SerializeQueryArgs<
    QueryArgumentType,
    string | number | boolean | Record<any, any>
  >

  /**
   * All of these are `undefined` at runtime, purely to be used in TypeScript declarations!
   */
  Types?: InfiniteQueryTypes<
    QueryArgumentType,
    PageParamType,
    BaseQueryFunctionType,
    TagTypes,
    ResultType,
    ReducerPath,
    RawResultType
  >
}

export type InfiniteQueryDefinition<
  QueryArgumentType,
  PageParamType,
  BaseQueryFunctionType extends BaseQueryFn,
  TagTypes extends string,
  ResultType,
  ReducerPath extends string = string,
  RawResultType extends
    BaseQueryResult<BaseQueryFunctionType> = BaseQueryResult<BaseQueryFunctionType>,
> =
  // Infinite query endpoints receive `{queryArg, pageParam}`
  BaseEndpointDefinition<
    InfiniteQueryCombinedArg<QueryArgumentType, PageParamType>,
    BaseQueryFunctionType,
    ResultType,
    RawResultType
  > &
    InfiniteQueryExtraOptions<
      TagTypes,
      ResultType,
      QueryArgumentType,
      PageParamType,
      BaseQueryFunctionType,
      ReducerPath,
      RawResultType
    >

type MutationTypes<
  QueryArgumentType,
  BaseQueryFunctionType extends BaseQueryFn,
  TagTypes extends string,
  ResultType,
  ReducerPath extends string = string,
  RawResultType extends
    BaseQueryResult<BaseQueryFunctionType> = BaseQueryResult<BaseQueryFunctionType>,
> = BaseEndpointTypes<
  QueryArgumentType,
  BaseQueryFunctionType,
  ResultType,
  RawResultType
> & {
  /**
   * The endpoint definition type. To be used with some internal generic types.
   * @example
   * ```ts
   * const useMyWrappedHook: UseMutation<typeof api.endpoints.query.Types.MutationDefinition> = ...
   * ```
   */
  MutationDefinition: MutationDefinition<
    QueryArgumentType,
    BaseQueryFunctionType,
    TagTypes,
    ResultType,
    ReducerPath
  >
  TagTypes: TagTypes
  ReducerPath: ReducerPath
}

/**
 * @public
 */
export interface MutationExtraOptions<
  TagTypes extends string,
  ResultType,
  QueryArgumentType,
  BaseQueryFunctionType extends BaseQueryFn,
  ReducerPath extends string = string,
  RawResultType extends
    BaseQueryResult<BaseQueryFunctionType> = BaseQueryResult<BaseQueryFunctionType>,
> extends CacheLifecycleMutationExtraOptions<
      ResultType,
      QueryArgumentType,
      BaseQueryFunctionType,
      ReducerPath
    >,
    QueryLifecycleMutationExtraOptions<
      ResultType,
      QueryArgumentType,
      BaseQueryFunctionType,
      ReducerPath
    > {
  type: DefinitionType.mutation

  /**
   * Used by `mutation` endpoints. Determines which cached data should be either re-fetched or removed from the cache.
   * Expects the same shapes as `providesTags`.
   *
   * @example
   *
   * ```ts
   * // codeblock-meta title="invalidatesTags example"
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
   *
   * interface Post {
   *   id: number;
   *   name: string;
   * }
   *
   * type PostsResponse = Post[];
   *
   * const api = createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   tagTypes: ['Posts'],
   *   endpoints: (build) => ({
   *     getPosts: build.query<PostsResponse, void>({
   *       query: () => 'posts',
   *       providesTags: (result) =>
   *         result
   *           ? [
   *               ...result.map(({ id }) => ({ type: 'Posts' as const, id })),
   *               { type: 'Posts', id: 'LIST' },
   *             ]
   *           : [{ type: 'Posts', id: 'LIST' }],
   *     }),
   *     addPost: build.mutation<Post, Partial<Post>>({
   *       query(body) {
   *         return {
   *           url: `posts`,
   *           method: 'POST',
   *           body,
   *         };
   *       },
   *       // highlight-start
   *       invalidatesTags: [{ type: 'Posts', id: 'LIST' }],
   *       // highlight-end
   *     }),
   *   }),
   * });
   * ```
   */
  invalidatesTags?: ResultDescription<
    TagTypes,
    ResultType,
    QueryArgumentType,
    BaseQueryError<BaseQueryFunctionType>,
    BaseQueryMeta<BaseQueryFunctionType>
  >
  /**
   * Not to be used. A mutation should not provide tags to the cache.
   */
  providesTags?: never

  /**
   * All of these are `undefined` at runtime, purely to be used in TypeScript declarations!
   */
  Types?: MutationTypes<
    QueryArgumentType,
    BaseQueryFunctionType,
    TagTypes,
    ResultType,
    ReducerPath,
    RawResultType
  >
}

export type MutationDefinition<
  QueryArgumentType,
  BaseQueryFunctionType extends BaseQueryFn,
  TagTypes extends string,
  ResultType,
  ReducerPath extends string = string,
  RawResultType extends
    BaseQueryResult<BaseQueryFunctionType> = BaseQueryResult<BaseQueryFunctionType>,
> = BaseEndpointDefinition<
  QueryArgumentType,
  BaseQueryFunctionType,
  ResultType,
  RawResultType
> &
  MutationExtraOptions<
    TagTypes,
    ResultType,
    QueryArgumentType,
    BaseQueryFunctionType,
    ReducerPath,
    RawResultType
  >

export type EndpointDefinition<
  QueryArgumentType,
  BaseQueryFunctionType extends BaseQueryFn,
  TagTypes extends string,
  ResultType,
  ReducerPath extends string = string,
  PageParamType = any,
  RawResultType extends
    BaseQueryResult<BaseQueryFunctionType> = BaseQueryResult<BaseQueryFunctionType>,
> =
  | QueryDefinition<
      QueryArgumentType,
      BaseQueryFunctionType,
      TagTypes,
      ResultType,
      ReducerPath,
      RawResultType
    >
  | MutationDefinition<
      QueryArgumentType,
      BaseQueryFunctionType,
      TagTypes,
      ResultType,
      ReducerPath,
      RawResultType
    >
  | InfiniteQueryDefinition<
      QueryArgumentType,
      PageParamType,
      BaseQueryFunctionType,
      TagTypes,
      ResultType,
      ReducerPath,
      RawResultType
    >

export type EndpointDefinitions = Record<
  string,
  EndpointDefinition<any, any, any, any, any, any, any>
>

export function isQueryDefinition(
  e: EndpointDefinition<any, any, any, any, any, any, any>,
): e is QueryDefinition<any, any, any, any, any, any> {
  return e.type === ENDPOINT_QUERY
}

export function isMutationDefinition(
  e: EndpointDefinition<any, any, any, any, any, any, any>,
): e is MutationDefinition<any, any, any, any, any, any> {
  return e.type === ENDPOINT_MUTATION
}

export function isInfiniteQueryDefinition(
  e: EndpointDefinition<any, any, any, any, any, any, any>,
): e is InfiniteQueryDefinition<any, any, any, any, any, any, any> {
  return e.type === ENDPOINT_INFINITEQUERY
}

export function isAnyQueryDefinition(
  e: EndpointDefinition<any, any, any, any>,
): e is
  | QueryDefinition<any, any, any, any>
  | InfiniteQueryDefinition<any, any, any, any, any> {
  return isQueryDefinition(e) || isInfiniteQueryDefinition(e)
}

export type EndpointBuilder<
  BaseQueryFunctionType extends BaseQueryFn,
  TagTypes extends string,
  ReducerPath extends string,
> = {
  /**
   * An endpoint definition that retrieves data, and may provide tags to the cache.
   *
   * @example
   * ```ts
   * // codeblock-meta title="Example of all query endpoint options"
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
   *
   * interface Post {
   *   id: number;
   *   name: string;
   * }
   *
   * interface PostsResponse {
   *   data: Post[];
   * }
   *
   * const api = createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   tagTypes: ['Post'],
   *   endpoints: (build) => ({
   *     getPost: build.query<Post[], number, PostsResponse>({
   *       query: (id) => ({ url: `post/${id}` }),
   *       // Pick out data and prevent nested properties in a hook or selector
   *       transformResponse: (response) => response.data,
   *       // Pick out error and prevent nested properties in a hook or selector
   *       transformErrorResponse: (response) => response.status,
   *       // `result` is the server response
   *       providesTags: (result, error, id) => [{ type: 'Post', id }],
   *       // trigger side effects or optimistic updates
   *       onQueryStarted(
   *         id,
   *         {
   *           dispatch,
   *           getState,
   *           extra,
   *           requestId,
   *           queryFulfilled,
   *           getCacheEntry,
   *           updateCachedData,
   *         },
   *       ) {},
   *       // handle subscriptions etc
   *       onCacheEntryAdded(
   *         id,
   *         {
   *           dispatch,
   *           getState,
   *           extra,
   *           requestId,
   *           cacheEntryRemoved,
   *           cacheDataLoaded,
   *           getCacheEntry,
   *           updateCachedData,
   *         },
   *       ) {},
   *     }),
   *   }),
   * });
   * ```
   */
  query<
    ResultType,
    QueryArgumentType,
    RawResultType extends
      BaseQueryResult<BaseQueryFunctionType> = BaseQueryResult<BaseQueryFunctionType>,
  >(
    definition: OmitFromUnion<
      QueryDefinition<
        QueryArgumentType,
        BaseQueryFunctionType,
        TagTypes,
        ResultType,
        ReducerPath,
        RawResultType
      >,
      'type'
    >,
  ): QueryDefinition<
    QueryArgumentType,
    BaseQueryFunctionType,
    TagTypes,
    ResultType,
    ReducerPath,
    RawResultType
  >

  /**
   * An endpoint definition that alters data on the server or will possibly invalidate the cache.
   *
   * @example
   * ```ts
   * // codeblock-meta title="Example of all mutation endpoint options"
   * import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
   *
   * interface Post {
   *   id: number;
   *   name: string;
   * }
   *
   * interface PostsResponse {
   *   data: Post[];
   * }
   *
   * const api = createApi({
   *   baseQuery: fetchBaseQuery({ baseUrl: '/' }),
   *   tagTypes: ['Post'],
   *   endpoints: (build) => ({
   *     updatePost: build.mutation<Post[], Partial<Post>, PostsResponse>({
   *       query: ({ id, ...patch }) => ({
   *         url: `post/${id}`,
   *         method: 'PATCH',
   *         body: patch,
   *       }),
   *       // Pick out data and prevent nested properties in a hook or selector
   *       transformResponse: (response) => response.data,
   *       // Pick out error and prevent nested properties in a hook or selector
   *       transformErrorResponse: (response) => response.status,
   *       // `result` is the server response
   *       invalidatesTags: (result, error, { id }) => [{ type: 'Post', id }],
   *       // trigger side effects or optimistic updates
   *       onQueryStarted(
   *         { id },
   *         { dispatch, getState, extra, requestId, queryFulfilled, getCacheEntry },
   *       ) {},
   *       // handle subscriptions etc
   *       onCacheEntryAdded(
   *         { id },
   *         {
   *           dispatch,
   *           getState,
   *           extra,
   *           requestId,
   *           cacheEntryRemoved,
   *           cacheDataLoaded,
   *           getCacheEntry,
   *         },
   *       ) {},
   *     }),
   *   }),
   * });
   * ```
   */
  mutation<
    MutationResultType,
    QueryArgumentType,
    RawResultType extends
      BaseQueryResult<BaseQueryFunctionType> = BaseQueryResult<BaseQueryFunctionType>,
  >(
    definition: OmitFromUnion<
      MutationDefinition<
        QueryArgumentType,
        BaseQueryFunctionType,
        TagTypes,
        MutationResultType,
        ReducerPath,
        RawResultType
      >,
      'type'
    >,
  ): MutationDefinition<
    QueryArgumentType,
    BaseQueryFunctionType,
    TagTypes,
    MutationResultType,
    ReducerPath,
    RawResultType
  >

  infiniteQuery<
    ResultType,
    QueryArgumentType,
    PageParamType,
    RawResultType extends
      BaseQueryResult<BaseQueryFunctionType> = BaseQueryResult<BaseQueryFunctionType>,
  >(
    definition: OmitFromUnion<
      InfiniteQueryDefinition<
        QueryArgumentType,
        PageParamType,
        BaseQueryFunctionType,
        TagTypes,
        ResultType,
        ReducerPath,
        RawResultType
      >,
      'type'
    >,
  ): InfiniteQueryDefinition<
    QueryArgumentType,
    PageParamType,
    BaseQueryFunctionType,
    TagTypes,
    ResultType,
    ReducerPath,
    RawResultType
  >
}

export type AssertTagTypes = <T extends FullTagDescription<string>>(t: T) => T

export function calculateProvidedBy<ResultType, QueryArg, ErrorType, MetaType>(
  description:
    | ResultDescription<string, ResultType, QueryArg, ErrorType, MetaType>
    | undefined,
  result: ResultType | undefined,
  error: ErrorType | undefined,
  queryArg: QueryArg,
  meta: MetaType | undefined,
  assertTagTypes: AssertTagTypes,
): readonly FullTagDescription<string>[] {
  const finalDescription = isFunction(description)
    ? description(
        result as ResultType,
        error as undefined,
        queryArg,
        meta as MetaType,
      )
    : description

  if (finalDescription) {
    return filterMap(finalDescription, isNotNullish, (tag) =>
      assertTagTypes(expandTagDescription(tag)),
    )
  }

  return []
}

function isFunction<T>(t: T): t is Extract<T, Function> {
  return typeof t === 'function'
}

export function expandTagDescription(
  description: TagDescription<string>,
): FullTagDescription<string> {
  return typeof description === 'string' ? { type: description } : description
}

export type QueryArgFrom<D extends BaseEndpointDefinition<any, any, any, any>> =
  D extends BaseEndpointDefinition<
    infer InferredQueryArgumentType,
    any,
    any,
    any
  >
    ? InferredQueryArgumentType
    : never

// Just extracting `QueryArg` from `BaseEndpointDefinition`
// doesn't sufficiently match here.
// We need to explicitly match against `InfiniteQueryDefinition`
export type InfiniteQueryArgFrom<
  D extends BaseEndpointDefinition<any, any, any, any>,
> =
  D extends InfiniteQueryDefinition<
    infer InferredQueryArgumentType,
    any,
    any,
    any,
    any,
    any,
    any
  >
    ? InferredQueryArgumentType
    : never

export type QueryArgFromAnyQuery<
  D extends BaseEndpointDefinition<any, any, any, any>,
> =
  D extends InfiniteQueryDefinition<any, any, any, any, any, any, any>
    ? InfiniteQueryArgFrom<D>
    : D extends QueryDefinition<any, any, any, any, any, any>
      ? QueryArgFrom<D>
      : never

export type ResultTypeFrom<
  D extends BaseEndpointDefinition<any, any, any, any>,
> =
  D extends BaseEndpointDefinition<any, any, infer InferredResultType, any>
    ? InferredResultType
    : unknown

export type ReducerPathFrom<
  D extends EndpointDefinition<any, any, any, any, any, any, any>,
> =
  D extends EndpointDefinition<
    any,
    any,
    any,
    any,
    infer InferredReducerPathType,
    any,
    any
  >
    ? InferredReducerPathType
    : unknown

export type TagTypesFrom<
  D extends EndpointDefinition<any, any, any, any, any, any, any>,
> =
  D extends EndpointDefinition<
    any,
    any,
    infer InferredTagTypes,
    any,
    any,
    any,
    any
  >
    ? InferredTagTypes
    : unknown

export type PageParamFrom<
  D extends InfiniteQueryDefinition<any, any, any, any, any, any, any>,
> =
  D extends InfiniteQueryDefinition<
    any,
    infer InferredPageParamType,
    any,
    any,
    any,
    any,
    any
  >
    ? InferredPageParamType
    : unknown

export type InfiniteQueryCombinedArg<QueryArgumentType, PageParamType> = {
  queryArg: QueryArgumentType
  pageParam: PageParamType
}

export type TagTypesFromApi<T> =
  T extends Api<any, any, any, infer InferredTagTypes>
    ? InferredTagTypes
    : never

export type DefinitionsFromApi<T> =
  T extends Api<any, infer InferredDefinitionsType, any, any>
    ? InferredDefinitionsType
    : never

export type TransformedResponse<
  NewDefinitions extends EndpointDefinitions,
  NewDefinitionsKeyType,
  ResultType,
> = NewDefinitionsKeyType extends keyof NewDefinitions
  ? NewDefinitions[NewDefinitionsKeyType]['transformResponse'] extends undefined
    ? ResultType
    : UnwrapPromise<
        ReturnType<
          NonUndefined<
            NewDefinitions[NewDefinitionsKeyType]['transformResponse']
          >
        >
      >
  : ResultType

export type OverrideResultType<Definition, NewResultType> =
  Definition extends QueryDefinition<
    infer InferredQueryArgumentType,
    infer InferredBaseQueryFunctionType,
    infer InferredApiTagTypes,
    any,
    infer InferredReducerPathType
  >
    ? QueryDefinition<
        InferredQueryArgumentType,
        InferredBaseQueryFunctionType,
        InferredApiTagTypes,
        NewResultType,
        InferredReducerPathType
      >
    : Definition extends MutationDefinition<
          infer InferredQueryArgumentType,
          infer InferredBaseQueryFunctionType,
          infer InferredTagTypes,
          any,
          infer InferredReducerPathType
        >
      ? MutationDefinition<
          InferredQueryArgumentType,
          InferredBaseQueryFunctionType,
          InferredTagTypes,
          NewResultType,
          InferredReducerPathType
        >
      : Definition extends InfiniteQueryDefinition<
            infer InferredQueryArgumentType,
            infer InferredPageParamType,
            infer InferredBaseQueryFunctionType,
            infer InferredTagTypes,
            any,
            infer InferredReducerPathType
          >
        ? InfiniteQueryDefinition<
            InferredQueryArgumentType,
            InferredPageParamType,
            InferredBaseQueryFunctionType,
            InferredTagTypes,
            NewResultType,
            InferredReducerPathType
          >
        : never

export type UpdateDefinitions<
  DefinitionsType extends EndpointDefinitions,
  NewTagTypes extends string,
  NewDefinitions extends EndpointDefinitions,
> = {
  [DefinitionsKeyType in keyof DefinitionsType]: DefinitionsType[DefinitionsKeyType] extends QueryDefinition<
    infer InferredQueryArgumentType,
    infer InferredBaseQueryFunctionType,
    any,
    infer InferredResultType,
    infer InferredReducerPathType
  >
    ? QueryDefinition<
        InferredQueryArgumentType,
        InferredBaseQueryFunctionType,
        NewTagTypes,
        TransformedResponse<
          NewDefinitions,
          DefinitionsKeyType,
          InferredResultType
        >,
        InferredReducerPathType
      >
    : DefinitionsType[DefinitionsKeyType] extends MutationDefinition<
          infer InferredQueryArgumentType,
          infer InferredBaseQueryFunctionType,
          any,
          infer InferredResultType,
          infer InferredReducerPathType
        >
      ? MutationDefinition<
          InferredQueryArgumentType,
          InferredBaseQueryFunctionType,
          NewTagTypes,
          TransformedResponse<
            NewDefinitions,
            DefinitionsKeyType,
            InferredResultType
          >,
          InferredReducerPathType
        >
      : DefinitionsType[DefinitionsKeyType] extends InfiniteQueryDefinition<
            infer InferredQueryArgumentType,
            infer InferredPageParamType,
            infer InferredBaseQueryFunctionType,
            any,
            infer InferredResultType,
            infer InferredReducerPathType
          >
        ? InfiniteQueryDefinition<
            InferredQueryArgumentType,
            InferredPageParamType,
            InferredBaseQueryFunctionType,
            NewTagTypes,
            TransformedResponse<
              NewDefinitions,
              DefinitionsKeyType,
              InferredResultType
            >,
            InferredReducerPathType
          >
        : never
}
