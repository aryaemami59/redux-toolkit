import * as babel from '@babel/core'
import type { Plugin } from 'esbuild'
import { getBuildExtensions } from 'esbuild-extra'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { InlineConfig, UserConfig } from 'tsdown'
import { defineConfig } from 'tsdown'
import type { MangleErrorsPluginOptions } from './scripts/mangleErrors.mjs'
import { mangleErrorsPlugin } from './scripts/mangleErrors.mjs'

const outputDir = path.join(import.meta.dirname, 'dist')

async function writeCommonJSEntry(folder: string, prefix: string) {
  await fs.writeFile(
    path.join(folder, 'index.js'),
    `'use strict';
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./${prefix}.production.min.cjs');
} else {
  module.exports = require('./${prefix}.development.cjs');
}`,
    { encoding: 'utf-8' },
  )
}

// Extract error strings, replace them with error codes, and write messages to a file
const mangleErrorsTransform: Plugin = {
  name: mangleErrorsPlugin.name,
  setup(build) {
    const { onTransform } = getBuildExtensions(build, mangleErrorsPlugin.name)

    onTransform({ loaders: ['ts', 'tsx'] }, async (args) => {
      try {
        const res = await babel.transformAsync(args.code, {
          parserOpts: {
            plugins: ['typescript', 'jsx'],
          },
          plugins: [
            [
              mangleErrorsPlugin,
              { minify: false } satisfies MangleErrorsPluginOptions,
            ],
          ],
        })

        if (res == null) {
          throw new Error('Babel transformAsync returned null')
        }

        return {
          code: res.code!,
          map: res.map!,
        }
      } catch (err) {
        console.error('Babel mangleErrors error: ', err)
        return null
      }
    })
  },
}

const external = [
  '@standard-schema/spec',
  '@standard-schema/utils',
  'immer',
  'react-redux',
  'react',
  'redux-thunk',
  'redux',
  'reselect',
]

export default defineConfig((cliOptions) => {
  console.log(cliOptions)
  const commonOptions = {
    cwd: import.meta.dirname,
    dts: false,
    exports: false,
    external: (id, parentId, isResolved) => {
      console.log({ id, parentId, isResolved })
    },
    failOnWarn: true,
    format: ['esm', 'cjs'],
    hash: false,
    nodeProtocol: true,
    plugins: [mangleErrorsTransform],
    sourcemap: true,
    target: ['esnext'],
    platform: 'node',
    tsconfig: path.join(import.meta.dirname, 'tsconfig.build.json'),
    outExtensions: (context) => ({
      js: context.format === 'es' ? '.mjs' : '.js',
      dts: context.format === 'es' ? '.d.mts' : '.d.ts',
    }),
    ...cliOptions,
  } as const satisfies InlineConfig

  return [
    {
      ...commonOptions,
      name: 'Redux-Toolkit-Core-ESM',
      entry: {
        'redux-toolkit.modern': 'src/index.ts',
      },
      // outExtensions: ({ format }) => ({
      //   js: format === 'es' ? '.mjs' : '.cjs',
      // }),
      copy: () => [
        {
          from: path.join(import.meta.dirname, 'src', 'uncheckedindexed.ts'),
          to: path.join(outputDir, 'uncheckedindexed.ts'),
        },
      ],
      format: ['esm'],
    },
    {
      ...commonOptions,
      name: 'Redux-Toolkit-React-ESM',
      external: external.concat('@reduxjs/toolkit'),
      entry: {
        'react/redux-toolkit-react.modern': 'src/react/index.ts',
      },
      outExtensions: () => ({ js: '.mjs' }),
      format: ['esm'],
    },
    {
      ...commonOptions,
      name: 'Redux-Toolkit-Query-ESM',
      external: external.concat('@reduxjs/toolkit'),
      entry: {
        'query/rtk-query.modern': 'src/query/index.ts',
      },
      outExtensions: () => ({ js: '.mjs' }),
      format: ['esm'],
    },
    {
      ...commonOptions,
      name: 'Redux-Toolkit-Query-React-ESM',
      external: external.concat('@reduxjs/toolkit'),
      entry: {
        'query/react/rtk-query-react.modern': 'src/query/react/index.ts',
      },
      outExtensions: () => ({ js: '.mjs' }),
      format: ['esm'],
    },
    {
      ...commonOptions,
      name: 'Redux-Toolkit-Core-CJS-Development',
      entry: {
        'cjs/redux-toolkit.development': 'src/index.ts',
      },
      outExtensions: () => ({ js: '.cjs' }),
      env: {
        NODE_ENV: 'development',
      },
      format: ['cjs'],
    },
    {
      ...commonOptions,
      name: 'Redux-Toolkit-React-CJS-Development',
      external: external.concat('@reduxjs/toolkit'),
      entry: {
        'react/cjs/redux-toolkit-react.development': 'src/react/index.ts',
      },
      outExtensions: () => ({ js: '.cjs' }),
      env: {
        NODE_ENV: 'development',
      },
      format: ['cjs'],
    },
    {
      ...commonOptions,
      name: 'Redux-Toolkit-Query-CJS-Development',
      external: external.concat('@reduxjs/toolkit'),
      entry: {
        'query/cjs/rtk-query.development': 'src/query/index.ts',
      },
      outExtensions: () => ({ js: '.cjs' }),
      env: {
        NODE_ENV: 'development',
      },
      format: ['cjs'],
    },
    {
      ...commonOptions,
      name: 'Redux-Toolkit-Query-React-CJS-Development',
      external: external.concat('@reduxjs/toolkit'),
      entry: {
        'query/react/cjs/rtk-query-react.development':
          'src/query/react/index.ts',
      },
      outExtensions: () => ({ js: '.cjs' }),
      env: {
        NODE_ENV: 'development',
      },
      format: ['cjs'],
    },
    {
      ...commonOptions,
      name: 'Redux-Toolkit-Core-CJS-Production',
      entry: {
        'cjs/redux-toolkit.production.min': 'src/index.ts',
      },
      outExtensions: () => ({ js: '.cjs' }),
      env: {
        NODE_ENV: 'production',
      },
      minify: true,
      format: ['cjs'],
      onSuccess: async () => {
        await writeCommonJSEntry(
          path.join(import.meta.dirname, 'dist', 'cjs'),
          'redux-toolkit',
        )
      },
    },

    {
      ...commonOptions,
      name: 'Redux-Toolkit-React-CJS-Production',
      external: external.concat('@reduxjs/toolkit'),
      entry: {
        'react/cjs/redux-toolkit-react.production.min': 'src/react/index.ts',
      },
      outExtensions: () => ({ js: '.cjs' }),
      env: {
        NODE_ENV: 'production',
      },
      minify: true,
      format: ['cjs'],
      onSuccess: async () => {
        await writeCommonJSEntry(
          path.join(import.meta.dirname, 'dist', 'react', 'cjs'),
          'redux-toolkit-react',
        )
      },
    },
    {
      ...commonOptions,
      name: 'Redux-Toolkit-Query-CJS-Production',
      external: external.concat('@reduxjs/toolkit'),
      entry: {
        'query/cjs/rtk-query.production.min': 'src/query/index.ts',
      },
      outExtensions: () => ({ js: '.cjs' }),
      env: {
        NODE_ENV: 'production',
      },
      minify: true,
      format: ['cjs'],
      onSuccess: async () => {
        await writeCommonJSEntry(
          path.join(import.meta.dirname, 'dist', 'query', 'cjs'),
          'rtk-query',
        )
      },
    },
    {
      ...commonOptions,
      name: 'Redux-Toolkit-Query-React-CJS-Production',
      external: external.concat('@reduxjs/toolkit'),
      entry: {
        'query/react/cjs/rtk-query-react.production.min':
          'src/query/react/index.ts',
      },
      outExtensions: () => ({ js: '.cjs' }),
      env: {
        NODE_ENV: 'production',
      },
      minify: true,
      format: ['cjs'],
      onSuccess: async () => {
        await writeCommonJSEntry(
          path.join(import.meta.dirname, 'dist', 'query', 'react', 'cjs'),
          'rtk-query-react',
        )
      },
    },

    {
      ...commonOptions,
      name: 'Redux-Toolkit-Core-Browser',
      entry: {
        'redux-toolkit.browser': 'src/index.ts',
      },
      outExtensions: () => ({ js: '.mjs' }),
      platform: 'browser',
      env: {
        NODE_ENV: 'production',
      },
      minify: 'dce-only',
      define: {
        process: 'undefined',
      },
      format: ['esm'],
    },

    {
      ...commonOptions,
      name: 'Redux-Toolkit-React-Browser',
      external: external.concat('@reduxjs/toolkit'),
      entry: {
        'react/redux-toolkit-react.browser': 'src/react/index.ts',
      },
      outExtensions: () => ({ js: '.mjs' }),
      platform: 'browser',
      env: {
        NODE_ENV: 'production',
      },
      minify: true,
      define: {
        process: 'undefined',
      },
      format: ['esm'],
    },
    {
      ...commonOptions,
      name: 'Redux-Toolkit-Query-Browser',
      external: external.concat('@reduxjs/toolkit'),
      entry: {
        'query/rtk-query.browser': 'src/query/index.ts',
      },
      outExtensions: () => ({ js: '.mjs' }),
      platform: 'browser',
      env: {
        NODE_ENV: 'production',
      },
      minify: true,
      define: {
        process: 'undefined',
      },
      format: ['esm'],
    },
    {
      ...commonOptions,
      name: 'Redux-Toolkit-Query-React-Browser',
      external: external.concat('@reduxjs/toolkit'),
      entry: {
        'query/react/rtk-query-react.browser': 'src/query/react/index.ts',
      },
      outExtensions: () => ({ js: '.mjs' }),
      platform: 'browser',
      env: {
        NODE_ENV: 'production',
      },
      minify: true,
      define: {
        process: 'undefined',
      },
      format: ['esm'],
    },
    {
      ...commonOptions,
      name: 'Redux-Toolkit-Core-Legacy-ESM',
      entry: {
        'redux-toolkit.legacy-esm': 'src/index.ts',
      },
      outExtensions: () => ({ js: '.js' }),
      format: ['esm'],
      target: ['es2017'],
    },
    {
      ...commonOptions,
      name: 'Redux-Toolkit-React-Legacy-ESM',
      external: external.concat('@reduxjs/toolkit'),
      entry: {
        'react/redux-toolkit-react.legacy-esm': 'src/react/index.ts',
      },
      outExtensions: () => ({ js: '.js' }),
      format: ['esm'],
      target: ['es2017'],
    },
    {
      ...commonOptions,
      name: 'Redux-Toolkit-Query-Legacy-ESM',
      external: external.concat('@reduxjs/toolkit'),
      entry: {
        'query/rtk-query.legacy-esm': 'src/query/index.ts',
      },
      outExtensions: () => ({ js: '.js' }),
      format: ['esm'],
      target: ['es2017'],
    },
    {
      ...commonOptions,
      name: 'Redux-Toolkit-Query-React-Legacy-ESM',
      external: external.concat('@reduxjs/toolkit'),
      entry: {
        'query/react/rtk-query-react.legacy-esm': 'src/query/react/index.ts',
      },
      outExtensions: () => ({ js: '.js' }),
      format: ['esm'],
      target: ['es2017'],
    },

    {
      ...commonOptions,
      name: 'Redux-Toolkit-Type-Definitions',
      entry: {
        index: 'src/index.ts',
      },
      // outExtensions: (context) => ({
      //   dts: context.format === 'es' ? '.d.mts' : '.d.ts',
      // }),
      // format: ['esm'],
      // sourcemap: false,
      external: [/uncheckedindexed/],
      dts: {
        emitDtsOnly: true,
        newContext: true,
        resolver: 'tsc',
        // newContext: true,
        // sourcemap: false,
        cjsDefault: true,
        // eager: true,
        // oxc: false,
        emitJs: false,
        tsconfig: path.join(import.meta.dirname, 'tsconfig.build.json'),
      },
    },

    {
      ...commonOptions,
      name: 'RTK-React-Type-Definitions',
      entry: {
        'react/index': 'src/react/index.ts',
      },
      dts: {
        newContext: true,
        // resolve: true,
        emitDtsOnly: true,
        emitJs: false,
        resolver: 'tsc',
        tsconfig: path.join(import.meta.dirname, 'tsconfig.build.json'),
      },
      external: [...external, '@reduxjs/toolkit', /uncheckedindexed/],
    },

    {
      ...commonOptions,
      name: 'RTK-Query-Type-Definitions',
      entry: {
        'query/index': 'src/query/index.ts',
      },
      dts: {
        newContext: true,
        // resolve: true,
        emitDtsOnly: true,
        emitJs: false,
        resolver: 'tsc',
        tsconfig: path.join(import.meta.dirname, 'tsconfig.build.json'),
      },
      external: [
        ...external,
        '@reduxjs/toolkit',
        '@reduxjs/toolkit/react',
        /uncheckedindexed/,
      ],
    },

    {
      ...commonOptions,
      name: 'RTK-Query-React-Type-Definitions',
      entry: {
        'query/react/index': 'src/query/react/index.ts',
      },
      dts: {
        newContext: true,
        // resolve: true,
        emitDtsOnly: true,
        emitJs: false,
        resolver: 'tsc',
        tsconfig: path.join(import.meta.dirname, 'tsconfig.build.json'),
      },
      external: [
        ...external,
        '@reduxjs/toolkit',
        '@reduxjs/toolkit/react',
        '@reduxjs/toolkit/query',
        /uncheckedindexed/,
      ],
    },
  ] as const satisfies UserConfig[]
})
