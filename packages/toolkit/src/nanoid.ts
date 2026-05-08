// Borrowed from https://github.com/ai/nanoid/blob/3.0.2/non-secure/index.js
// This alphabet uses `A-Za-z0-9_-` symbols. A genetic algorithm helped
// optimize the gzip compression for this alphabet.
let urlAlphabet =
  'ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUvz_KqYTJkLxpZXIjQW'

/**
 * Generates a URL-friendly, pseudorandom unique ID string using the
 * `A-Za-z0-9_-` alphabet. Borrowed from
 * {@link https://github.com/ai/nanoid | nanoid}.
 *
 * @param size - The desired length of the generated ID. Defaults to `21`.
 * @returns A pseudorandom unique ID string of the requested length.
 *
 * @example <caption>Generate a unique ID</caption>
 *
 * ```ts
 * import { nanoid } from "@reduxjs/toolkit"
 *
 * const id = nanoid()
 * ```
 *
 * @public
 */
export let nanoid = (size = 21) => {
  let id = ''
  // A compact alternative for `for (var i = 0; i < step; i++)`.
  let i = size
  while (i--) {
    // `| 0` is more compact and faster than `Math.floor()`.
    id += urlAlphabet[(Math.random() * 64) | 0]
  }
  return id
}
