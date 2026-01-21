import * as path from 'node:path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
  plugins: [tsconfigPaths({ projects: ['./tsconfig.json'] })],
  root: import.meta.dirname,
  test: {
    alias: process.env.TEST_DIST
      ? {
          '@rtk-query/codegen-openapi': path.join(
            import.meta.dirname,
            '..',
            '..',
            'node_modules',
            '@rtk-query/codegen-openapi'
          ),
        }
      : undefined,
    clearMocks: true,
    dir: path.join(import.meta.dirname, 'test'),
    globals: true,
    name: {
      label: packageJson.name,
    },
    pool: 'forks',
    root: import.meta.dirname,
    setupFiles: ['./test/vitest.setup.ts'],
    testTimeout: 10_000,
    typecheck: {
      checker: 'tsc',
      enabled: true,
      include: ['**/*.{test,spec}-d.?(c|m)ts?(x)'],
      tsconfig: path.join(import.meta.dirname, 'tsconfig.json'),
    },
    unstubEnvs: true,
    watch: false,
  },
});
