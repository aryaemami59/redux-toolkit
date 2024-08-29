import type { KnipConfig } from 'knip'

const knipConfig = {
  entry: [
    'src/index.ts',
    'src/react/index.ts',
    'src/query/index.ts',
    'src/query/react/index.ts',
  ],
  ignore: ['**/tests/**'],
  typescript: { config: 'tsconfig.json' },
  project: ['src/**', 'scripts/**'],
  vitest: { config: 'vitest.config.mts' },
  tsup: { config: 'tsup.config.ts' },
  'size-limit': { config: '.size-limit.cjs' },
  include: [
    // 'dependencies',
    'exports',
    // 'files',
    // 'devDependencies',
    // 'optionalPeerDependencies',
    'unlisted',
    // 'binaries',
    'unresolved',
    'types',
    'nsExports',
    'nsTypes',
    'duplicates',
    'enumMembers',
    'classMembers',
  ],
} satisfies KnipConfig

export default knipConfig
