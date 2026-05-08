/**
 * If either `://` or `//` is present consider it to be an absolute url.
 *
 * @param url - The URL string to test.
 * @returns `true` if the URL is absolute, otherwise `false`.
 */

export function isAbsoluteUrl(url: string) {
  return new RegExp(`(^|:)//`).test(url)
}
