import { createVitestConfig } from '@reduxjs/vitest-config';
import path from 'node:path';

export default createVitestConfig({
  test: {
    alias: process.env.TEST_DIST
      ? {
          '@rtk-query/codegen-openapi': path.join(__dirname, '../..', 'node_modules/@rtk-query/codegen-openapi'),
        }
      : undefined,
    pool: 'forks',
    setupFiles: ['./test/vitest.setup.ts'],
  },
});
