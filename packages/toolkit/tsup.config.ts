import * as babel from '@babel/core'
import type { Plugin } from 'esbuild'
import { getBuildExtensions } from 'esbuild-extra'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Options as TsupOptions } from 'tsup'
import { defineConfig } from 'tsup'
import type { MangleErrorsPluginOptions } from './scripts/mangleErrors.mjs'
import { mangleErrorsPlugin } from './scripts/mangleErrors.mjs'

// No __dirname under Node ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const outputDir = path.join(__dirname, 'dist')

async function writeCommonJSEntry(folder: string, prefix: string) {
  fs.writeFile(
    path.join(folder, 'index.js'),
    `'use strict'
if (process.env.NODE_ENV === 'production') {
  module.exports = require('./${prefix}.production.min.cjs')
} else {
  module.exports = require('./${prefix}.development.cjs')
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

const tsconfig: NonNullable<TsupOptions['tsconfig']> = path.join(
  __dirname,
  './tsconfig.build.json',
)

export default defineConfig((overrideOptions): TsupOptions[] => {
  const commonOptions = {
    splitting: false,
    sourcemap: true,
    tsconfig,
    external: [
      'redux',
      'react',
      'react-redux',
      'immer',
      'redux-thunk',
      'reselect',
      '@reduxjs/toolkit',
    ],
    esbuildPlugins: [mangleErrorsTransform],
    ...overrideOptions,
  } satisfies TsupOptions

  return [
    {
      ...commonOptions,
      name: 'Redux-Toolkit-ESM',
      entry: {
        'redux-toolkit.modern': 'src/index.ts',
        'react/redux-toolkit-react.modern': 'src/react/index.ts',
        'query/rtk-query.modern': 'src/query/index.ts',
        'query/react/rtk-query-react.modern': 'src/query/react/index.ts',
      },
      outExtension: () => ({ js: '.mjs' }),
      format: ['esm'],
      target: ['esnext'],
    },
    {
      ...commonOptions,
      name: 'Redux-Toolkit-Browser',
      entry: {
        'redux-toolkit.browser': 'src/index.ts',
        'react/redux-toolkit-react.browser': 'src/react/index.ts',
        'query/rtk-query.browser': 'src/query/index.ts',
        'query/react/rtk-query-react.browser': 'src/query/react/index.ts',
      },
      outExtension: () => ({ js: '.mjs' }),
      platform: 'browser',
      env: {
        NODE_ENV: 'production',
      },
      minify: true,
      define: {
        process: 'undefined',
      },
      replaceNodeEnv: true,
      format: ['esm'],
      target: ['es2017'],
    },
    {
      ...commonOptions,
      name: 'Redux-Toolkit-CJS-Development',
      entry: {
        'cjs/redux-toolkit.development': 'src/index.ts',
        'react/cjs/redux-toolkit-react.development': 'src/react/index.ts',
        'query/cjs/rtk-query.development': 'src/query/index.ts',
        'query/react/cjs/rtk-query-react.development':
          'src/query/react/index.ts',
      },
      outExtension: () => ({ js: '.cjs' }),
      env: {
        NODE_ENV: 'development',
      },
      format: ['cjs'],
      target: ['esnext'],
    },
    {
      ...commonOptions,
      name: 'Redux-Toolkit-CJS-Production',
      entry: {
        'cjs/redux-toolkit.production.min': 'src/index.ts',
        'react/cjs/redux-toolkit-react.production.min': 'src/react/index.ts',
        'query/cjs/rtk-query.production.min': 'src/query/index.ts',
        'query/react/cjs/rtk-query-react.production.min':
          'src/query/react/index.ts',
      },
      outExtension: () => ({ js: '.cjs' }),
      env: {
        NODE_ENV: 'production',
      },
      minify: true,
      replaceNodeEnv: true,
      format: ['cjs'],
      target: ['esnext'],
    },
    {
      ...commonOptions,
      name: 'Redux-Toolkit-Legacy-ESM',
      entry: {
        'redux-toolkit.legacy-esm': 'src/index.ts',
        'react/redux-toolkit-react.legacy-esm': 'src/react/index.ts',
        'query/rtk-query.legacy-esm': 'src/query/index.ts',
        'query/react/rtk-query-react.legacy-esm': 'src/query/react/index.ts',
      },
      outExtension: () => ({ js: '.js' }),
      format: ['esm'],
      target: ['es2017'],
      onSuccess: async () => {
        await Promise.all(
          Object.entries({
            'dist/cjs': 'redux-toolkit',
            'dist/react/cjs': 'redux-toolkit-react',
            'dist/query/cjs': 'rtk-query',
            'dist/query/react/cjs': 'rtk-query-react',
          } as const).map(
            async ([outDir, outputPrefix]) =>
              await writeCommonJSEntry(outDir, outputPrefix),
          ),
        )

        await fs.copyFile(
          'src/uncheckedindexed.ts',
          path.join(outputDir, 'uncheckedindexed.ts'),
        )
      },
    },
    {
      ...commonOptions,
      name: 'Redux-Toolkit-Type-Definitions',
      entry: {
        index: 'src/index.ts',
      },
      dts: {
        only: true,
      },
      external: [/uncheckedindexed/],
      format: ['cjs'],
      target: ['esnext'],
    },
    {
      ...commonOptions,
      name: 'RTK-React-Type-Definitions',
      entry: {
        'react/index': 'src/react/index.ts',
      },
      dts: {
        only: true,
      },
      external: ['@reduxjs/toolkit', /uncheckedindexed/],
      format: ['cjs'],
      target: ['esnext'],
    },
    {
      ...commonOptions,
      name: 'RTK-Query-Type-Definitions',
      entry: {
        'query/index': 'src/query/index.ts',
      },
      dts: {
        only: true,
      },
      external: [
        '@reduxjs/toolkit',
        '@reduxjs/toolkit/react',
        /uncheckedindexed/,
      ],
      format: ['cjs'],
      target: ['esnext'],
    },
    {
      ...commonOptions,
      name: 'RTK-Query-React-Type-Definitions',
      entry: {
        'query/react/index': 'src/query/react/index.ts',
      },
      dts: {
        only: true,
      },
      external: [
        '@reduxjs/toolkit',
        '@reduxjs/toolkit/react',
        '@reduxjs/toolkit/query',
        /uncheckedindexed/,
      ],
      format: ['cjs'],
      target: ['esnext'],
    },
  ]
})
// export default defineConfig((options) => {
//   const configs = entryPoints
//     .map((entryPointConfig) => {
//       const artifactOptions: TsupOptions[] = buildTargets.map((buildTarget) => {
//         const { prefix, folder, entryPoint, externals } = entryPointConfig
//         const { format, minify, env, name, target } = buildTarget
//         const outputFilename = `${prefix}.${name}`

//         const folderSegments = [outputDir, folder]
//         if (format === 'cjs') {
//           folderSegments.push('cjs')
//         }

//         const outputFolder = path.join(...folderSegments)

//         const extension =
//           name === 'legacy-esm' ? '.js' : format === 'esm' ? '.mjs' : '.cjs'

//         const defineValues: Record<string, string> = {}

//         if (env) {
//           Object.assign(defineValues, {
//             NODE_ENV: env,
//           })
//         }

//         const generateTypedefs = name === 'modern' && format === 'esm'

//         return {
//           name: `${prefix}-${name}`,
//           entry: {
//             [outputFilename]: entryPoint,
//           },
//           format,
//           tsconfig,
//           outDir: outputFolder,
//           target,
//           outExtension: () => ({ js: extension }),
//           // minify,
//           sourcemap: true,
//           external: externals,
//           esbuildPlugins: [mangleErrorsTransform],

//           env: defineValues,
//           async onSuccess() {
//             if (format === 'cjs' && name === 'production.min') {
//               writeCommonJSEntry(outputFolder, prefix)
//             } else if (generateTypedefs) {
//               if (folder === '') {
//                 // we need to delete the declaration file and replace it with the original source file
//                 fs.rmSync(path.join(outputFolder, 'uncheckedindexed.d.ts'), {
//                   force: true,
//                 })

//                 fs.copyFileSync(
//                   'src/uncheckedindexed.ts',
//                   path.join(outputFolder, 'uncheckedindexed.ts'),
//                 )
//               }
//               // TODO Copy/generate `.d.mts` files?
//               // const inputTypedefsFile = `${outputFilename}.d.ts`
//               // const outputTypedefsFile = `${outputFilename}.d.mts`
//               // const inputTypedefsPath = path.join(
//               //   outputFolder,
//               //   inputTypedefsFile
//               // )
//               // const outputTypedefsPath = path.join(
//               //   outputFolder,
//               //   outputTypedefsFile
//               // )
//               // while (!fs.existsSync(inputTypedefsPath)) {
//               //   // console.log(
//               //   //   'Waiting for typedefs to be generated: ' + inputTypedefsFile
//               //   // )
//               //   await delay(100)
//               // }
//               // fs.copyFileSync(inputTypedefsPath, outputTypedefsPath)
//             }
//           },
//         } satisfies TsupOptions
//       })

//       return artifactOptions satisfies TsupOptions[]
//     })
//     .flat()
//     .concat([
//       {
//         name: 'Redux-Toolkit-Type-Definitions',
//         format: ['cjs'],
//         tsconfig,
//         entry: { index: './src/index.ts' },
//         external: [/uncheckedindexed/],
//         dts: {
//           only: true,
//         },
//       },
//       {
//         name: 'RTK-React-Type-Definitions',
//         format: ['cjs'],
//         tsconfig,
//         entry: { 'react/index': './src/react/index.ts' },
//         external: ['@reduxjs/toolkit', /uncheckedindexed/],
//         dts: {
//           only: true,
//         },
//       },
//       {
//         name: 'RTK-Query-Type-Definitions',
//         format: ['cjs'],
//         tsconfig,
//         entry: { 'query/index': './src/query/index.ts' },
//         external: [
//           '@reduxjs/toolkit',
//           '@reduxjs/toolkit/react',
//           /uncheckedindexed/,
//         ],
//         dts: {
//           only: true,
//         },
//       },
//       {
//         name: 'RTK-Query-React-Type-Definitions',
//         format: ['cjs'],
//         tsconfig,
//         entry: { 'query/react/index': './src/query/react/index.ts' },
//         external: [
//           '@reduxjs/toolkit',
//           '@reduxjs/toolkit/react',
//           '@reduxjs/toolkit/query',
//           /uncheckedindexed/,
//         ],
//         dts: {
//           only: true,
//         },
//       },
//     ])

//   return configs
// })
