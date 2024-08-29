import * as babel from '@babel/core'
import type { Plugin } from 'esbuild'
import { getBuildExtensions } from 'esbuild-extra'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import type { Options } from 'tsup'
import { defineConfig } from 'tsup'
import type { MangleErrorsPluginOptions } from './scripts/mangleErrors.mjs'
import { mangleErrorsPlugin } from './scripts/mangleErrors.mjs'

async function writeCommonJSEntry(folder: string, prefix: string) {
  await fs.writeFile(
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

const tsconfig = 'tsconfig.build.json' satisfies Options['tsconfig']

export default defineConfig((overrideOptions): Options[] => {
  const commonOptions = {
    clean: true,
    format: ['cjs', 'esm'],
    sourcemap: true,
    splitting: false,
    target: ['esnext'],
    tsconfig,
    ...overrideOptions,
  } satisfies Options

  return [
    {
      ...commonOptions,
      name: 'redux-toolkit',
      entry: { index: 'src/index.ts' },
      external: [
        'react',
        'react-redux',
        'redux',
        'reselect',
        'redux-thunk',
        'immer',
      ],
    },
    {
      ...commonOptions,
      name: 'redux-toolkit-react',
      entry: { 'react/index': 'src/react/index.ts' },
      external: [
        'react',
        'react-redux',
        'redux',
        'reselect',
        'redux-thunk',
        'immer',
        '@redux/toolkit',
      ],
    },
    {
      ...commonOptions,
      name: 'redux-toolkit-query',
      entry: { 'query/index': 'src/query/index.ts' },
      external: [
        'react',
        'react-redux',
        'redux',
        'reselect',
        'redux-thunk',
        'immer',
        '@redux/toolkit',
        '@redux/toolkit/react',
      ],
    },
    {
      ...commonOptions,
      name: 'redux-toolkit-query-react',
      entry: { 'query/react/index': 'src/query/react/index.ts' },
      external: [
        'react',
        'react-redux',
        'redux',
        'reselect',
        'redux-thunk',
        'immer',
        '@redux/toolkit',
        '@redux/toolkit/react',
        '@redux/toolkit/query',
      ],
    },
  ]
})
