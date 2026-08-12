import type { ConfigFile } from '@rtk-query/codegen-openapi';
import { defineConfig } from '@rtk-query/codegen-openapi';

describe(defineConfig, () => {
  test('returns a ConfigFile', () => {
    const config = defineConfig({
      schemaFile: './fixtures/petstore.json',
      apiFile: './fixtures/emptyApi.ts',
      outputFile: './tmp/example.ts',
    });

    expectTypeOf(config).toEqualTypeOf<ConfigFile>();
  });

  test('accepts array-valued options', () => {
    defineConfig({
      schemaFile: './fixtures/petstore.json',
      apiFile: './fixtures/emptyApi.ts',
      outputFile: './tmp/example.ts',
      filterEndpoints: ['getPetById', 'addPet'],
      endpointOverrides: [{ pattern: 'loginUser', type: 'mutation' }],
    });
  });

  test('accepts the multi-output form of ConfigFile', () => {
    defineConfig({
      schemaFile: './fixtures/petstore.json',
      apiFile: './fixtures/emptyApi.ts',
      outputFiles: {
        './tmp/a.ts': { filterEndpoints: ['getPetById'] },
        './tmp/b.ts': { filterEndpoints: ['addPet'] },
      },
    });
  });

  test('rejects a config missing required options', () => {
    // @ts-expect-error `apiFile` and `outputFile`/`outputFiles` are required
    defineConfig({ schemaFile: './fixtures/petstore.json' });
  });

  test('rejects unknown options', () => {
    defineConfig({
      schemaFile: './fixtures/petstore.json',
      apiFile: './fixtures/emptyApi.ts',
      outputFile: './tmp/example.ts',
      // @ts-expect-error not a real option - this is the main reason to reach for `defineConfig`
      notAnOption: true,
    });
  });

  test('rejects a wrongly-typed option', () => {
    defineConfig({
      schemaFile: './fixtures/petstore.json',
      apiFile: './fixtures/emptyApi.ts',
      outputFile: './tmp/example.ts',
      // @ts-expect-error `hooks` is a boolean or an object, never a string
      hooks: 'yes',
    });
  });
});
