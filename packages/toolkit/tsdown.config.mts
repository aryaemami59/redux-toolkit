import * as babel from '@babel/core'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import type { InlineConfig, Rolldown, UserConfig } from 'tsdown'
import { defineConfig } from 'tsdown'
import packageJson from './package.json' with { type: 'json' }
import type { MangleErrorsPluginOptions } from './scripts/mangleErrors.mjs'
import { mangleErrorsPlugin } from './scripts/mangleErrors.mjs'

async function writeCommonJSEntry(folder: string, prefix: string) {
  await fs.writeFile(
    path.join(folder, 'index.js'),
    `"use strict";
if (process.env.NODE_ENV === "production") {
  module.exports = require("./${prefix}.production.min.cjs");
} else {
  module.exports = require("./${prefix}.development.cjs");
}`,
    { encoding: 'utf-8' },
  )
}

// Extract error strings, replace them with error codes, and write messages to a file
const mangleErrorsTransform = (
  mangleErrorsPluginOptions: MangleErrorsPluginOptions = {},
): Rolldown.Plugin => {
  const { minify = false } = mangleErrorsPluginOptions

  return {
    name: mangleErrorsPlugin.name,
    transform: {
      filter: {
        code: {
          include: ['throw new'],
        },
        id: {
          exclude: ['src/**/*.d.ts', /node_modules/],
          include: ['src/**/*.ts', 'src/**/*.tsx'],
        },
        moduleType: { include: ['ts', 'tsx'] },
      },

      async handler(code, id, meta) {
        try {
          const res = await babel.transformAsync(code, {
            sourceFileName: id,
            parserOpts: {
              sourceFilename: id,
              plugins: ['typescript', 'jsx'],
            },
            plugins: [
              [
                mangleErrorsPlugin,
                { minify } satisfies MangleErrorsPluginOptions,
              ],
            ],
          })

          if (res == null) {
            throw new Error('Babel transformAsync returned null')
          }

          return {
            code: res.code!,
            map: res.map!,
            invalidate: true,
            meta: {},
            moduleSideEffects: false,
            moduleType: meta.moduleType,
            packageJsonPath: path.join(import.meta.dirname, 'package.json'),
          }
        } catch (err) {
          console.error('Babel mangleErrors error: ', err)
          return null
        }
      },
    },
  }
}

const peerAndProductionDependencies = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.peerDependencies,
} as const)

export default defineConfig((cliOptions) => {
  const commonOptions = {
    /**
     * @todo Comply with
     * {@link https://rolldown.rs/options/output-clean-dir#multiple-configurations | this}
     */
    clean: false,
    cwd: import.meta.dirname,
    debug: {
      clean: false,
    },
    dts: false,
    external: peerAndProductionDependencies,
    failOnWarn: true,
    fixedExtension: false,
    format: ['es', 'cjs'],
    hash: false,
    inlineOnly: [],
    nodeProtocol: true,
    shims: true,
    outDir: 'dist',
    inputOptions: (options, format) => ({
      ...options,
      experimental: {
        ...options.experimental,
        nativeMagicString: true,
        ...(format === 'cjs'
          ? {
              attachDebugInfo: 'none',
            }
          : {}),
      },
      transform: {
        ...options.transform,
        inject: {
          ...options.transform?.inject,
          React: ['react', '*'] as const,
        },
      },
    }),
    outputOptions: (options, format, context) => ({
      ...options,
      ...(format === 'cjs' && !context.cjsDts
        ? {
            externalLiveBindings: false,
            intro: '"use strict";',
          }
        : {}),
      ...(context.cjsDts
        ? {}
        : {
            legalComments: 'none',
          }),
    }),
    plugins: [mangleErrorsTransform()],
    sourcemap: true,
    target: ['esnext'],
    platform: 'node',
    tsconfig: path.join(import.meta.dirname, 'tsconfig.build.json'),
    outExtensions: ({ format, options }) => ({
      dts: format === 'es' ? '.d.mts' : '.d.ts',
      js:
        format === 'es'
          ? `${options.platform === 'browser' ? '.browser' : ''}.mjs`
          : '.cjs',
    }),
    ...cliOptions,
  } as const satisfies InlineConfig

  const sharedDTSConfig = {
    ...commonOptions,
    dts: {
      build: false,
      cjsDefault: false,
      cwd: commonOptions.cwd,
      dtsInput: false,
      eager: true,
      emitDtsOnly: true,
      emitJs: false,
      enabled: true,
      incremental: false,
      newContext: true,
      oxc: false,
      parallel: false,
      resolver: 'tsc',
      sideEffects: false,
      sourcemap: true,
      tsconfig: commonOptions.tsconfig,
    },
    external: [...peerAndProductionDependencies, /uncheckedindexed/],
    inputOptions: (options) => ({
      ...options,
      experimental: {
        ...options.experimental,
        attachDebugInfo: 'none',
      },
    }),

    /**
     * @todo Investigate why an unexpected `index.js` file is still emitted
     * even with `emitDtsOnly: true`. The goal is to produce `.d.ts`
     * outputs for CJS builds without generating any JavaScript files.
     *
     * Until the root cause is identified, we disable source map generation
     * to avoid producing additional unwanted artifacts.
     */
    sourcemap: false,
    onSuccess: async ({ entry, outDir }) => {
      const entries = Object.keys(entry)

      const relativeOutputEntryPath = entries[0] ?? 'index'

      if (!relativeOutputEntryPath.endsWith('index')) {
        return
      }

      const outputEntryPathSegments = relativeOutputEntryPath
        .replace(/(index)$/, '$1.cjs')
        .split(path.posix.sep)

      const absoluteOutputEntryPath = path.join(
        outDir,
        ...outputEntryPathSegments,
      )

      await fs.rm(absoluteOutputEntryPath, {
        force: true,
        recursive: true,
      })
    },
  } as const satisfies InlineConfig

  const modernEsmConfig = {
    ...commonOptions,
    format: ['es'],
    outExtensions: () => ({ js: '.modern.mjs' }),
  } as const satisfies InlineConfig

  const developmentCjsConfig = {
    ...commonOptions,
    define: {
      process: JSON.stringify('process'),
    },
    env: {
      NODE_ENV: 'development',
    },
    format: ['cjs'],
    minify: 'dce-only',
    treeshake: {
      annotations: true,
      moduleSideEffects: false,
      commonjs: true,
    },
    outExtensions: () => ({ js: '.development.cjs' }),
  } as const satisfies InlineConfig

  const productionCjsConfig = {
    ...commonOptions,
    define: {
      process: JSON.stringify('process'),
    },
    env: {
      NODE_ENV: 'production',
    },
    format: ['cjs'],
    minify: true,
    treeshake: {
      annotations: true,
      moduleSideEffects: false,
      commonjs: true,
    },
    outExtensions: () => ({ js: '.production.min.cjs' }),
    onSuccess: async ({ outDir }) => {
      await writeCommonJSEntry(path.join(outDir, 'cjs'), 'redux-toolkit')
    },
  } as const satisfies InlineConfig

  const browserEsmConfig = {
    ...commonOptions,
    define: {
      process: 'undefined',
      window: JSON.stringify('window'),
    },
    env: {
      NODE_ENV: 'production',
    },
    format: ['es'],
    minify: true,
    platform: 'browser',
  } as const satisfies InlineConfig

  const legacyEsmConfig = {
    ...commonOptions,
    outExtensions: () => ({ js: '.legacy-esm.js' }),
    format: ['es'],
    target: ['es2017'],
  } as const satisfies InlineConfig

  return [
    {
      ...modernEsmConfig,
      name: 'Redux-Toolkit-Core-ESM',
      entry: {
        'redux-toolkit': 'src/index.ts',
      },
      copy: ({ outDir }) => [
        {
          from: path.join(import.meta.dirname, 'src', 'uncheckedindexed.ts'),
          to: outDir,
        },
      ],
    },
    {
      ...modernEsmConfig,
      name: 'Redux-Toolkit-React-ESM',
      entry: {
        'react/redux-toolkit-react': 'src/react/index.ts',
      },
      external: [...peerAndProductionDependencies, packageJson.name],
    },
    {
      ...modernEsmConfig,
      name: 'Redux-Toolkit-Query-ESM',
      entry: {
        'query/rtk-query': 'src/query/index.ts',
      },
      external: [
        ...peerAndProductionDependencies,
        packageJson.name,
        `${packageJson.name}/react`,
      ],
    },
    {
      ...modernEsmConfig,
      name: 'Redux-Toolkit-Query-React-ESM',
      entry: {
        'query/react/rtk-query-react': 'src/query/react/index.ts',
      },
      external: [
        ...peerAndProductionDependencies,
        packageJson.name,
        `${packageJson.name}/react`,
        `${packageJson.name}/query`,
      ],
    },
    {
      ...developmentCjsConfig,
      name: 'Redux-Toolkit-Core-CJS-Development',
      entry: {
        'cjs/redux-toolkit': 'src/index.ts',
      },
    },
    {
      ...developmentCjsConfig,
      name: 'Redux-Toolkit-React-CJS-Development',
      entry: {
        'react/cjs/redux-toolkit-react': 'src/react/index.ts',
      },
      external: [...peerAndProductionDependencies, packageJson.name],
    },
    {
      ...developmentCjsConfig,
      name: 'Redux-Toolkit-Query-CJS-Development',
      entry: {
        'query/cjs/rtk-query': 'src/query/index.ts',
      },
      external: [
        ...peerAndProductionDependencies,
        packageJson.name,
        `${packageJson.name}/react`,
      ],
    },
    {
      ...developmentCjsConfig,
      name: 'Redux-Toolkit-Query-React-CJS-Development',
      entry: {
        'query/react/cjs/rtk-query-react': 'src/query/react/index.ts',
      },
      external: [
        ...peerAndProductionDependencies,
        packageJson.name,
        `${packageJson.name}/react`,
        `${packageJson.name}/query`,
      ],
    },
    {
      ...productionCjsConfig,
      name: 'Redux-Toolkit-Core-CJS-Production',
      entry: {
        'cjs/redux-toolkit': 'src/index.ts',
      },
      onSuccess: async ({ outDir }) => {
        await writeCommonJSEntry(path.join(outDir, 'cjs'), 'redux-toolkit')
      },
    },

    {
      ...productionCjsConfig,
      name: 'Redux-Toolkit-React-CJS-Production',
      entry: {
        'react/cjs/redux-toolkit-react': 'src/react/index.ts',
      },
      external: [...peerAndProductionDependencies, packageJson.name],
      onSuccess: async ({ outDir }) => {
        await writeCommonJSEntry(
          path.join(outDir, 'react', 'cjs'),
          'redux-toolkit-react',
        )
      },
    },
    {
      ...productionCjsConfig,
      name: 'Redux-Toolkit-Query-CJS-Production',
      entry: {
        'query/cjs/rtk-query': 'src/query/index.ts',
      },
      external: [
        ...peerAndProductionDependencies,
        packageJson.name,
        `${packageJson.name}/react`,
      ],
      onSuccess: async ({ outDir }) => {
        await writeCommonJSEntry(path.join(outDir, 'query', 'cjs'), 'rtk-query')
      },
    },
    {
      ...productionCjsConfig,
      name: 'Redux-Toolkit-Query-React-CJS-Production',
      entry: {
        'query/react/cjs/rtk-query-react': 'src/query/react/index.ts',
      },
      external: [
        ...peerAndProductionDependencies,
        packageJson.name,
        `${packageJson.name}/react`,
        `${packageJson.name}/query`,
      ],
      onSuccess: async ({ outDir }) => {
        await writeCommonJSEntry(
          path.join(outDir, 'query', 'react', 'cjs'),
          'rtk-query-react',
        )
      },
    },

    {
      ...browserEsmConfig,
      name: 'Redux-Toolkit-Core-Browser',
      entry: {
        'redux-toolkit': 'src/index.ts',
      },
    },

    {
      ...browserEsmConfig,
      name: 'Redux-Toolkit-React-Browser',
      entry: {
        'react/redux-toolkit-react': 'src/react/index.ts',
      },
      external: [...peerAndProductionDependencies, packageJson.name],
    },
    {
      ...browserEsmConfig,
      name: 'Redux-Toolkit-Query-Browser',
      entry: {
        'query/rtk-query': 'src/query/index.ts',
      },
      external: [
        ...peerAndProductionDependencies,
        packageJson.name,
        `${packageJson.name}/react`,
      ],
    },
    {
      ...browserEsmConfig,
      name: 'Redux-Toolkit-Query-React-Browser',
      entry: {
        'query/react/rtk-query-react': 'src/query/react/index.ts',
      },
      external: [
        ...peerAndProductionDependencies,
        packageJson.name,
        `${packageJson.name}/react`,
        `${packageJson.name}/query`,
      ],
    },
    {
      ...legacyEsmConfig,
      name: 'Redux-Toolkit-Core-Legacy-ESM',
      entry: {
        'redux-toolkit': 'src/index.ts',
      },
    },
    {
      ...legacyEsmConfig,
      name: 'Redux-Toolkit-React-Legacy-ESM',
      entry: {
        'react/redux-toolkit-react': 'src/react/index.ts',
      },
      external: [...peerAndProductionDependencies, packageJson.name],
    },
    {
      ...legacyEsmConfig,
      name: 'Redux-Toolkit-Query-Legacy-ESM',
      entry: {
        'query/rtk-query': 'src/query/index.ts',
      },
      external: [
        ...peerAndProductionDependencies,
        packageJson.name,
        `${packageJson.name}/react`,
      ],
    },
    {
      ...legacyEsmConfig,
      name: 'Redux-Toolkit-Query-React-Legacy-ESM',
      entry: {
        'query/react/rtk-query-react': 'src/query/react/index.ts',
      },
      external: [
        ...peerAndProductionDependencies,
        packageJson.name,
        `${packageJson.name}/react`,
        `${packageJson.name}/query`,
      ],
    },

    {
      ...sharedDTSConfig,
      name: 'Redux-Toolkit-Type-Definitions',
      entry: {
        index: 'src/index.ts',
      },
    },

    {
      ...sharedDTSConfig,
      name: 'RTK-React-Type-Definitions',
      entry: {
        'react/index': 'src/react/index.ts',
      },
      external: [...sharedDTSConfig.external, packageJson.name],
    },

    {
      ...sharedDTSConfig,
      name: 'RTK-Query-Type-Definitions',
      entry: {
        'query/index': 'src/query/index.ts',
      },
      external: [
        ...sharedDTSConfig.external,
        packageJson.name,
        `${packageJson.name}/react`,
      ],
    },

    {
      ...sharedDTSConfig,
      name: 'RTK-Query-React-Type-Definitions',
      entry: {
        'query/react/index': 'src/query/react/index.ts',
      },
      external: [`${packageJson.name}/react`, `${packageJson.name}/query`],
    },
  ] as const satisfies UserConfig[]
})
