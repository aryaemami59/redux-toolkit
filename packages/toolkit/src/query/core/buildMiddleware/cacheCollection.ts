import type { QueryDefinition } from '../../endpointDefinitions'
import type { ConfigState, QueryCacheKey } from '../apiState'
import { isAnyOf } from '../rtkImports'
import type {
  ApiMiddlewareInternalHandler,
  InternalHandlerBuilder,
  QueryStateMeta,
  SubMiddlewareApi,
  TimeoutId,
} from './types'

export type ReferenceCacheCollection = never

function isObjectEmpty(obj: Record<any, any>) {
  // Apparently a for..in loop is faster than `Object.keys()` here:
  // https://stackoverflow.com/a/59787784/62937
  for (const k in obj) {
    // If there is at least one key, it's not empty
    return false
  }
  return true
}

export type CacheCollectionQueryExtraOptions = {
  /**
   * Overrides the api-wide definition of `keepUnusedDataFor` for this endpoint only. _(This value is in seconds.)_
   *
   * This is how long RTK Query will keep your data cached for **after** the last component unsubscribes. For example, if you query an endpoint, then unmount the component, then mount another component that makes the same request within the given time frame, the most recent value will be served from the cache.
   */
  keepUnusedDataFor?: number
}

// Per https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#maximum_delay_value , browsers store
// `setTimeout()` timer values in a 32-bit int. If we pass a value in that's larger than that,
// it wraps and ends up executing immediately.
// Our `keepUnusedDataFor` values are in seconds, so adjust the numbers here accordingly.
export const THIRTY_TWO_BIT_MAX_INT = 2_147_483_647
export const THIRTY_TWO_BIT_MAX_TIMER_SECONDS = 2_147_483_647 / 1_000 - 1

export const buildCacheCollectionHandler: InternalHandlerBuilder = ({
  reducerPath,
  api,
  queryThunk,
  context,
  internalState,
}) => {
  const { removeQueryResult, unsubscribeQueryResult, cacheEntriesUpserted } =
    api.internalActions

  const canTriggerUnsubscribe = isAnyOf(
    unsubscribeQueryResult.match,
    queryThunk.fulfilled,
    queryThunk.rejected,
    cacheEntriesUpserted.match,
  )

  function anySubscriptionsRemainingForKey(queryCacheKey: string) {
    const subscriptions = internalState.currentSubscriptions[queryCacheKey]
    return !!subscriptions && !isObjectEmpty(subscriptions)
  }

  const currentRemovalTimeouts: QueryStateMeta<TimeoutId> = {}

  const handler: ApiMiddlewareInternalHandler = (
    action,
    mwApi,
    internalState,
  ) => {
    if (canTriggerUnsubscribe(action)) {
      const state = mwApi.getState()[reducerPath]
      let queryCacheKeys: QueryCacheKey[]

      if (cacheEntriesUpserted.match(action)) {
        queryCacheKeys = action.payload.map(
          (entry) => entry.queryDescription.queryCacheKey,
        )
      } else {
        const { queryCacheKey } = unsubscribeQueryResult.match(action)
          ? action.payload
          : action.meta.arg
        queryCacheKeys = [queryCacheKey]
      }

      for (const queryCacheKey of queryCacheKeys) {
        handleUnsubscribe(
          queryCacheKey,
          state.queries[queryCacheKey]?.endpointName,
          mwApi,
          state.config,
        )
      }
    }

    if (api.util.resetApiState.match(action)) {
      for (const [key, timeout] of Object.entries(currentRemovalTimeouts)) {
        if (timeout) clearTimeout(timeout)
        delete currentRemovalTimeouts[key]
      }
    }

    if (context.hasRehydrationInfo(action)) {
      const state = mwApi.getState()[reducerPath]
      const { queries } = context.extractRehydrationInfo(action)!
      for (const [queryCacheKey, queryState] of Object.entries(queries)) {
        // Gotcha:
        // If rehydrating before the endpoint has been injected,the global `keepUnusedDataFor`
        // will be used instead of the endpoint-specific one.
        handleUnsubscribe(
          queryCacheKey as QueryCacheKey,
          queryState?.endpointName,
          mwApi,
          state.config,
        )
      }
    }
  }

  function handleUnsubscribe(
    queryCacheKey: QueryCacheKey,
    endpointName: string | undefined,
    api: SubMiddlewareApi,
    config: ConfigState<string>,
  ) {
    const endpointDefinition = context.endpointDefinitions[
      endpointName!
    ] as QueryDefinition<any, any, any, any>
    const keepUnusedDataFor =
      endpointDefinition?.keepUnusedDataFor ?? config.keepUnusedDataFor

    if (keepUnusedDataFor === Infinity) {
      // Hey, user said keep this forever!
      return
    }
    // Prevent `setTimeout` timers from overflowing a 32-bit internal int, by
    // clamping the max value to be at most 1000ms less than the 32-bit max.
    // Look, a 24.8-day keepalive ought to be enough for anybody, right? :)
    // Also avoid negative values too.
    const finalKeepUnusedDataFor = Math.max(
      0,
      Math.min(keepUnusedDataFor, THIRTY_TWO_BIT_MAX_TIMER_SECONDS),
    )

    if (!anySubscriptionsRemainingForKey(queryCacheKey)) {
      const currentTimeout = currentRemovalTimeouts[queryCacheKey]
      if (currentTimeout) {
        clearTimeout(currentTimeout)
      }

      currentRemovalTimeouts[queryCacheKey] = setTimeout(() => {
        if (!anySubscriptionsRemainingForKey(queryCacheKey)) {
          api.dispatch(removeQueryResult({ queryCacheKey }))
        }
        delete currentRemovalTimeouts![queryCacheKey]
      }, finalKeepUnusedDataFor * 1000)
    }
  }

  return handler
}
