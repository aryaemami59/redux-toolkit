import path from 'node:path';
import { createVitestConfig } from '@reduxjs/vitest-config';

export default createVitestConfig({
  test: {
    alias: process.env.TEST_DIST
      ? {
          '@rtk-query/codegen-openapi': path.join(__dirname, '../..', 'node_modules/@rtk-query/codegen-openapi'),
        }
      : undefined,
    testTimeout: 10_000,
    pool: 'forks',
    setupFiles: ['./test/vitest.setup.ts'],
  },
});
