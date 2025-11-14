import type { ThunkDispatch } from '@reduxjs/toolkit'
import type { MaybePromise, UnwrapPromise } from './tsHelpers'

export interface BaseQueryApi {
  signal: AbortSignal
  abort: (reason?: string) => void
  dispatch: ThunkDispatch<any, any, any>
  getState: () => unknown
  extra: unknown
  endpoint: string
  type: 'query' | 'mutation'
  /**
   * Only available for queries: indicates if a query has been forced,
   * i.e. it would have been fetched even if there would already be a cache entry
   * (this does not mean that there is already a cache entry though!)
   *
   * This can be used to for example add a `Cache-Control: no-cache` header for
   * invalidated queries.
   */
  forced?: boolean
  /**
   * Only available for queries: the cache key that was used to store the query result
   */
  queryCacheKey?: string
}

export type QueryReturnValue<T = unknown, E = unknown, M = unknown> =
  | {
      error: E
      data?: undefined
      meta?: M
    }
  | {
      error?: undefined
      data: T
      meta?: M
    }

export type BaseQueryFn<
  Args = any,
  Result = unknown,
  Error = unknown,
  DefinitionExtraOptions = {},
  Meta = {},
> = (
  args: Args,
  api: BaseQueryApi,
  extraOptions: DefinitionExtraOptions,
) => MaybePromise<QueryReturnValue<Result, Error, Meta>>

export type BaseQueryEnhancer<
  AdditionalArgs = unknown,
  AdditionalDefinitionExtraOptions = unknown,
  Config = void,
> = <BaseQueryFunctionType extends BaseQueryFn>(
  baseQuery: BaseQueryFunctionType,
  config: Config,
) => BaseQueryFn<
  BaseQueryArg<BaseQueryFunctionType> & AdditionalArgs,
  BaseQueryResult<BaseQueryFunctionType>,
  BaseQueryError<BaseQueryFunctionType>,
  BaseQueryExtraOptions<BaseQueryFunctionType> &
    AdditionalDefinitionExtraOptions,
  NonNullable<BaseQueryMeta<BaseQueryFunctionType>>
>

/**
 * @public
 */
export type BaseQueryResult<BaseQueryFunctionType extends BaseQueryFn> =
  UnwrapPromise<ReturnType<BaseQueryFunctionType>> extends infer Unwrapped
    ? Unwrapped extends { data: any }
      ? Unwrapped['data']
      : never
    : never

/**
 * @public
 */
export type BaseQueryMeta<BaseQueryFunctionType extends BaseQueryFn> =
  UnwrapPromise<ReturnType<BaseQueryFunctionType>>['meta']

/**
 * @public
 */
export type BaseQueryError<BaseQueryFunctionType extends BaseQueryFn> = Exclude<
  UnwrapPromise<ReturnType<BaseQueryFunctionType>>,
  { error?: undefined }
>['error']

/**
 * @public
 */
export type BaseQueryArg<T extends (arg: any, ...args: any[]) => any> =
  T extends (arg: infer A, ...args: any[]) => any ? A : any

/**
 * @public
 */
export type BaseQueryExtraOptions<BaseQueryFunctionType extends BaseQueryFn> =
  Parameters<BaseQueryFunctionType>[2]
