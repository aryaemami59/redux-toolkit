// inlined from https://github.com/EskiMojo14/uncheckedindexed

import type { IfMaybeUndefined } from './tsHelpers'

// relies on remaining as a TS file, not .d.ts
const testAccess = ({} as Record<string, 0>)['a']

export type IfUncheckedIndexedAccess<True, False> = IfMaybeUndefined<
  typeof testAccess,
  True,
  False
>

export type UncheckedIndexedAccess<T> = IfUncheckedIndexedAccess<
  T | undefined,
  T
>
