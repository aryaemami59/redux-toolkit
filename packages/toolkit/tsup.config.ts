import * as babel from '@babel/core'
import type { Plugin } from 'esbuild'
import { getBuildExtensions } from 'esbuild-extra'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Options as TsupOptions } from 'tsup'
import { defineConfig } from 'tsup'

// No __dirname under Node ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const outputDir = path.join(__dirname, 'dist')

export interface BuildOptions {
  format: 'cjs' | 'esm'
  name:
    | 'development'
    | 'production.min'
    | 'legacy-esm'
    | 'modern'
    | 'browser'
    | 'umd'
    | 'umd.min'
  minify: boolean
  env: 'development' | 'production' | ''
  target?:
    | 'es2017'
    | 'es2018'
    | 'es2019'
    | 'es2020'
    | 'es2021'
    | 'es2022'
    | 'esnext'
}

export interface EntryPointOptions {
  prefix: string
  folder: string
  entryPoint: string
  extractionConfig: string
  externals?: string[]
}

const buildTargets: BuildOptions[] = [
  {
    format: 'cjs',
    name: 'development',
    target: 'esnext',
    minify: false,
    env: 'development',
  },
  {
    format: 'cjs',
    name: 'production.min',
    target: 'esnext',
    minify: true,
    env: 'production',
  },
  // ESM, embedded `process`: modern Webpack dev
  {
    format: 'esm',
    name: 'modern',
    target: 'esnext',
    minify: false,
    env: '',
  },
  // ESM, embedded `process`: fallback for Webpack 4,
  // which doesn't support `exports` field or optional chaining
  {
    format: 'esm',
    name: 'legacy-esm',
    target: 'esnext',
    minify: false,
    env: '',
  },
  // ESM, pre-compiled "prod": browser prod
  {
    format: 'esm',
    name: 'browser',
    target: 'esnext',
    minify: true,
    env: 'production',
  },
]

const entryPoints: EntryPointOptions[] = [
  {
    prefix: 'redux-toolkit',
    folder: '',
    entryPoint: 'src/index.ts',
    extractionConfig: 'api-extractor.json',
  },
  {
    prefix: 'redux-toolkit-react',
    folder: 'react/',
    entryPoint: 'src/react/index.ts',
    extractionConfig: 'api-extractor-react.json',
    externals: ['redux', '@reduxjs/toolkit'],
  },
  {
    prefix: 'rtk-query',
    folder: 'query',
    entryPoint: 'src/query/index.ts',
    extractionConfig: 'api-extractor.query.json',
    externals: ['redux', '@reduxjs/toolkit'],
  },
  {
    prefix: 'rtk-query-react',
    folder: 'query/react',
    entryPoint: 'src/query/react/index.ts',
    extractionConfig: 'api-extractor.query-react.json',
    externals: ['redux', '@reduxjs/toolkit'],
  },
]

function writeCommonJSEntry(folder: string, prefix: string) {
  fs.writeFileSync(
    path.join(folder, 'index.js'),
    `'use strict'
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./${prefix}.production.min.cjs')
} else {
  module.exports = require('./${prefix}.development.cjs')
}`,
  )
}

// Extract error strings, replace them with error codes, and write messages to a file
const mangleErrorsTransform: Plugin = {
  name: 'mangle-errors-plugin',
  setup(build) {
    const { onTransform } = getBuildExtensions(build, 'mangle-errors-plugin')

    onTransform({ loaders: ['ts', 'tsx'] }, async (args) => {
      try {
        const res = babel.transformSync(args.code, {
          parserOpts: {
            plugins: ['typescript', 'jsx'],
          },
          plugins: [['./scripts/mangleErrors.cjs', { minify: false }]],
        })!
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

const tsconfig: NonNullable<TsupOptions['tsconfig']> = path.join(
  __dirname,
  './tsconfig.build.json',
)

export default defineConfig((options) => {
  const commonOptions: TsupOptions = {
    clean: true,
    dts: true,
    sourcemap: true,
    tsconfig,
    // cjsInterop: true,
    plugins: [mangleErrorsTransform],
    target: ['es2017'],
    outExtension: ({ format }) => ({ js: format === 'esm' ? '.mjs' : '.cjs' }),
    // splitting: false,
    format: ['esm', 'cjs'],
  }

  return [
    {
      ...commonOptions,
      entry: [
        './src/index.ts',
        // path.resolve('src'),
        // path.resolve('src/index.ts'),
        // 'src/react/index.ts',
        // 'src/query/index.ts',
        // 'src/query/react/index.ts',
      ],
      outDir: 'dist',
      // outDir: path.resolve('dist'),
    },
    {
      ...commonOptions,
      entry: ['./src/react/index.ts'],
      outDir: 'dist/react',
      external: ['redux', '@reduxjs/toolkit'],
    },
    {
      ...commonOptions,
      entry: ['./src/query/index.ts'],
      outDir: 'dist/query',
      external: ['redux', '@reduxjs/toolkit'],
    },
    {
      ...commonOptions,
      entry: ['./src/query/react/index.ts'],
      outDir: 'dist/query/react',
      external: ['redux', '@reduxjs/toolkit'],
    },
  ]
})
