// inlined from https://github.com/EskiMojo14/uncheckedindexed

// relies on remaining as a TS file, not .d.ts
export type IfUndefined<P, True, False> = [undefined] extends [P] ? True : False

const testAccess = ({} as Record<string, 0>)['a']

export type IfUncheckedIndexedAccess<True, False> = IfUndefined<
  typeof testAccess,
  True,
  False
>

export type UncheckedIndexedAccess<T> = IfUncheckedIndexedAccess<
  T | undefined,
  T
>
