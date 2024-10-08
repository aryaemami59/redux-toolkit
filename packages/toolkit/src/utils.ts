import { isPlainObject } from 'redux'
import { isDraftable } from './externalImports'
import { createNextState } from './index'

export function getTimeMeasureUtils(maxDelay: number, fnName: string) {
  let elapsed = 0
  return {
    measureTime<T>(fn: () => T): T {
      const started = Date.now()
      try {
        return fn()
      } finally {
        const finished = Date.now()
        elapsed += finished - started
      }
    },
    warnIfExceeded() {
      if (elapsed > maxDelay) {
        console.warn(`${fnName} took ${elapsed}ms, which is more than the warning threshold of ${maxDelay}ms.
If your state or actions are very large, you may want to disable the middleware as it might cause too much of a slowdown in development mode. See https://redux-toolkit.js.org/api/getDefaultMiddleware for instructions.
It is disabled in production builds, so you don't need to worry about that.`)
      }
    },
  }
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function find<T>(
  iterable: Iterable<T>,
  comparator: (item: T) => boolean,
): T | undefined {
  for (const entry of iterable) {
    if (comparator(entry)) {
      return entry
    }
  }

  return undefined
}

export class Tuple<Items extends ReadonlyArray<unknown> = []> extends Array<
  Items[number]
> {
  constructor(length: number)
  constructor(...items: Items)
  constructor(...items: any[]) {
    super(...items)
    Object.setPrototypeOf(this, Tuple.prototype)
  }

  static override get [Symbol.species]() {
    return Tuple as any
  }

  override concat<AdditionalItems extends ReadonlyArray<unknown>>(
    items: Tuple<AdditionalItems>,
  ): Tuple<[...Items, ...AdditionalItems]>
  override concat<AdditionalItems extends ReadonlyArray<unknown>>(
    items: AdditionalItems,
  ): Tuple<[...Items, ...AdditionalItems]>
  override concat<AdditionalItems extends ReadonlyArray<unknown>>(
    ...items: AdditionalItems
  ): Tuple<[...Items, ...AdditionalItems]>
  override concat(...arr: any[]) {
    return super.concat.apply(this, arr)
  }

  prepend<AdditionalItems extends ReadonlyArray<unknown>>(
    items: Tuple<AdditionalItems>,
  ): Tuple<[...AdditionalItems, ...Items]>
  prepend<AdditionalItems extends ReadonlyArray<unknown>>(
    items: AdditionalItems,
  ): Tuple<[...AdditionalItems, ...Items]>
  prepend<AdditionalItems extends ReadonlyArray<unknown>>(
    ...items: AdditionalItems
  ): Tuple<[...AdditionalItems, ...Items]>
  prepend(...arr: any[]) {
    if (arr.length === 1 && Array.isArray(arr[0])) {
      return new Tuple(...arr[0].concat(this))
    }
    return new Tuple(...arr.concat(this))
  }
}

export function freezeDraftable<T>(val: T) {
  return isDraftable(val) ? createNextState(val, () => {}) : val
}

interface WeakMapEmplaceHandler<K extends object, V> {
  /**
   * Will be called to get value, if no value is currently in map.
   */
  insert?(key: K, map: WeakMap<K, V>): V
  /**
   * Will be called to update a value, if one exists already.
   */
  update?(previous: V, key: K, map: WeakMap<K, V>): V
}

interface MapEmplaceHandler<K, V> {
  /**
   * Will be called to get value, if no value is currently in map.
   */
  insert?(key: K, map: Map<K, V>): V
  /**
   * Will be called to update a value, if one exists already.
   */
  update?(previous: V, key: K, map: Map<K, V>): V
}

export function emplace<K, V>(
  map: Map<K, V>,
  key: K,
  handler: MapEmplaceHandler<K, V>,
): V
export function emplace<K extends object, V>(
  map: WeakMap<K, V>,
  key: K,
  handler: WeakMapEmplaceHandler<K, V>,
): V
/**
 * Allow inserting a new value, or updating an existing one
 * @throws if called for a key with no current value and no `insert` handler is provided
 * @returns current value in map (after insertion/updating)
 * ```ts
 * // return current value if already in map, otherwise initialise to 0 and return that
 * const num = emplace(map, key, {
 *   insert: () => 0
 * })
 *
 * // increase current value by one if already in map, otherwise initialise to 0
 * const num = emplace(map, key, {
 *   update: (n) => n + 1,
 *   insert: () => 0,
 * })
 *
 * // only update if value's already in the map - and increase it by one
 * if (map.has(key)) {
 *   const num = emplace(map, key, {
 *     update: (n) => n + 1,
 *   })
 * }
 * ```
 *
 * @remarks
 * Based on https://github.com/tc39/proposal-upsert currently in Stage 2 - maybe in a few years we'll be able to replace this with direct method calls
 */
export function emplace<K extends object, V>(
  map: WeakMap<K, V>,
  key: K,
  handler: WeakMapEmplaceHandler<K, V>,
): V {
  if (map.has(key)) {
    let value = map.get(key) as V
    if (handler.update) {
      value = handler.update(value, key, map)
      map.set(key, value)
    }
    return value
  }
  if (!handler.insert)
    throw new Error('No insert provided for key not already in map')
  const inserted = handler.insert(key, map)
  map.set(key, inserted)
  return inserted
}

export function capitalize(str: string) {
  return /* @__PURE__ */ str.replace(
    str[0],
    /* @__PURE__ */ str[0].toUpperCase(),
  )
}

export function countObjectKeys(obj: Record<any, any>) {
  let count = 0

  for (const _key in obj) {
    count++
  }

  return count
}

export function isNotNullish<T>(v: T | null | undefined): v is T {
  return v != null
}

export function copyWithStructuralSharing<T>(oldObj: any, newObj: T): T
export function copyWithStructuralSharing(oldObj: any, newObj: any): any {
  // remove type guard
  // const iPO: (_: any) => boolean = isPlainObject
  if (
    oldObj === newObj ||
    !(
      /* @__PURE__ */ (
        /* @__PURE__ */ (isPlainObject(oldObj) &&
          /* @__PURE__ */ isPlainObject(newObj)) ||
        (Array.isArray(oldObj) && Array.isArray(newObj))
      )
    )
  ) {
    return newObj
  }
  const newKeys = Object.keys(newObj)
  const oldKeys = Object.keys(oldObj)

  let isSameObject = newKeys.length === oldKeys.length
  const mergeObj: any = Array.isArray(newObj) ? [] : {}
  for (const key of newKeys) {
    mergeObj[key] = copyWithStructuralSharing(
      oldObj[key as keyof typeof oldObj],
      newObj[key as keyof typeof newObj],
    )
    if (isSameObject)
      isSameObject = oldObj[key as keyof typeof oldObj] === mergeObj[key]
  }
  return isSameObject ? oldObj : mergeObj
}

/**
 * Alternative to `Array.flat(1)`
 * @param arr An array like [1,2,3,[1,2]]
 * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat
 */
export const flatten = (arr: readonly any[]) => [].concat(...arr)

/**
 * If either :// or // is present consider it to be an absolute url
 *
 * @param url string
 */

export function isAbsoluteUrl(url: string) {
  return new RegExp(`(^|:)//`).test(url)
}

/**
 * Assumes true for a non-browser env, otherwise makes a best effort
 * @link https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilityState
 */
export function isDocumentVisible(): boolean {
  // `document` may not exist in non-browser envs (like RN)
  if (typeof document === 'undefined') {
    return true
  }
  // Match true for visible, prerender, undefined
  return document.visibilityState !== 'hidden'
}

/**
 * Assumes a browser is online if `undefined`, otherwise makes a best effort
 * @link https://developer.mozilla.org/en-US/docs/Web/API/NavigatorOnLine/onLine
 */
export function isOnline() {
  // We set the default config value in the store, so we'd need to check for this in a SSR env
  return typeof navigator === 'undefined'
    ? true
    : navigator.onLine === undefined
      ? true
      : navigator.onLine
}

export function isValidUrl(string: string) {
  try {
    new URL(string)
  } catch (_) {
    return false
  }

  return true
}

const withoutTrailingSlash = (url: string) => url.replace(/\/$/, '')
const withoutLeadingSlash = (url: string) => url.replace(/^\//, '')

export function joinUrls(
  base: string | undefined,
  url: string | undefined,
): string {
  if (!base) {
    return url!
  }
  if (!url) {
    return base
  }

  if (isAbsoluteUrl(url)) {
    return url
  }

  const delimiter = base.endsWith('/') || !url.startsWith('?') ? '/' : ''
  base = withoutTrailingSlash(base)
  url = withoutLeadingSlash(url)

  return `${base}${delimiter}${url}`
}
