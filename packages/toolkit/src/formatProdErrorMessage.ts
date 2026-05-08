/**
 * Adapted from React:
 * {@link https://github.com/facebook/react/blob/master/packages/shared/formatProdErrorMessage.js | formatProdErrorMessage}.
 *
 * Do not require this module directly! Use normal throw error calls. These
 * messages will be replaced with error codes during build.
 *
 * @param code - The numeric error code to format into a minified error message.
 */
export function formatProdErrorMessage(code: number) {
  return (
    `Minified Redux Toolkit error #${code}; visit https://redux-toolkit.js.org/Errors?code=${code} for the full message or ` +
    'use the non-minified dev environment for full errors. '
  )
}
