import { defineConfig } from '@rtk-query/codegen-openapi';

// Paths are relative to this file - the CLI chdirs to the config file's directory.
export default defineConfig({
  schemaFile: '../fixtures/petstore.yaml',
  apiFile: '../fixtures/emptyApi.ts',
  outputFile: '../tmp/example.ts',
});
