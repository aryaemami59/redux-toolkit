import { join, sep } from 'path'
import { Check, SizeLimitConfig } from 'size-limit'
import webpack from 'webpack'

const esmSuffixes = ['modern.mjs' /*, 'browser.mjs', 'legacy-esm.js'*/]
const cjsSuffixes = [/*'development.cjs',*/ 'production.min.cjs']

function withRtkPath(suffix, cjs = false) {
  /**
   * @param {string} name
   */
  function alias(name) {
    return `${cjs ? `cjs${sep}` : ''}${name}.${suffix}`
  }
  /**
   * @param {webpack.Configuration} config
   */
  return (config) => {
    ;(config.plugins ??= []).push(
      new webpack.NormalModuleReplacementPlugin(
        /@reduxjs\/toolkit\/query\/react/,
        // 'dist/query/react/rtk-query-react.modern.mjs',
        join(__dirname, 'dist/query/react/rtk-query-react.modern.mjs'),
        // pathToFileURL(join(__dirname, 'dist/query/react/rtk-query-react.modern.mjs')).href,
      ),
      new webpack.NormalModuleReplacementPlugin(
        /@reduxjs\/toolkit\/query/,
        // 'dist/query/rtk-query.modern.mjs',
        join(__dirname, 'dist/query/rtk-query.modern.mjs'),
        // pathToFileURL(join(__dirname, 'dist/query/rtk-query.modern.mjs')).href,
      ),
      new webpack.NormalModuleReplacementPlugin(
        /@reduxjs\/toolkit\/react/,
        // 'dist/react/redux-toolkit-react.modern.mjs',
        // pathToFileURL(join(__dirname, 'dist/react/redux-toolkit-react.modern.mjs')).href,
        join(__dirname, 'dist/react/redux-toolkit-react.modern.mjs'),
      ),
      new webpack.NormalModuleReplacementPlugin(
        /@reduxjs\/toolkit/,
        // 'dist/redux-toolkit.modern.mjs',
        // pathToFileURL(join(__dirname, 'dist/redux-toolkit.modern.mjs')).href,
        join(__dirname, 'dist/redux-toolkit.modern.mjs'),
      ),
      new webpack.NormalModuleReplacementPlugin(
        /rtk-query-react.modern.mjs/,
        (r) => {
          const old = r.request
          r.request = r.request.replace(
            /rtk-query-react.modern.mjs$/,
            alias('rtk-query-react'),
          )
          // console.log(old, '=>', r.request)
          // console.log(old === r.request)
        },
      ),
      new webpack.NormalModuleReplacementPlugin(/rtk-query.modern.mjs/, (r) => {
        const old = r.request
        r.request = r.request.replace(
          /rtk-query.modern.mjs$/,
          alias('rtk-query'),
        )
        //console.log(old, '=>', r.request)
      }),
      new webpack.NormalModuleReplacementPlugin(
        /redux-toolkit-react.modern.mjs$/,
        (r) => {
          const old = r.request
          r.request = r.request.replace(
            /redux-toolkit-react.modern.mjs$/,
            alias('redux-toolkit-react'),
          )
          // console.log(old, '=>', r.request)
        },
      ),
      new webpack.NormalModuleReplacementPlugin(
        /redux-toolkit.modern.mjs$/,
        (r) => {
          const old = r.request
          r.request = r.request.replace(
            /redux-toolkit.modern.mjs$/,
            alias('redux-toolkit'),
          )
          // console.log(old, '=>', r.request)
        },
      ),
    )

    if (suffix === 'production.min.cjs') {
      ;(config.resolve ??= {}).mainFields = ['main', 'module']
    }
    ;(config.optimization ??= {}).nodeEnv = 'production'
    return config
  }
}

const ignoreAll = [
  '@reduxjs/toolkit',
  '@reduxjs/toolkit/query',
  'immer',
  'redux',
  'reselect',
  'redux-thunk',
]

// const entryPoints = [
//   {
//     name: `1. entry point: @reduxjs/toolkit`,
//     path: 'dist/redux-toolkit.modern.mjs',
//   },
//   {
//     name: `1. entry point: @reduxjs/toolkit/react`,
//     path: 'dist/react/redux-toolkit-react.modern.mjs',
//   },
//   {
//     name: `1. entry point: @reduxjs/toolkit/query`,
//     path: 'dist/query/rtk-query.modern.mjs',
//   },
//   {
//     name: `1. entry point: @reduxjs/toolkit/query/react`,
//     path: 'dist/query/react/rtk-query-react.modern.mjs',
//   },
//   {
//     name: `2. entry point: @reduxjs/toolkit (without dependencies)`,
//     path: 'dist/redux-toolkit.modern.mjs',
//     ignore: ignoreAll,
//   },
//   {
//     name: `2. entry point: @reduxjs/toolkit/react (without dependencies)`,
//     path: 'dist/react/redux-toolkit-react.modern.mjs',
//     ignore: ignoreAll,
//   },
//   {
//     name: `2. entry point: @reduxjs/toolkit/query (without dependencies)`,
//     path: 'dist/query/rtk-query.modern.mjs',
//     ignore: ignoreAll,
//   },
//   {
//     name: `2. entry point: @reduxjs/toolkit/query/react (without dependencies)`,
//     path: 'dist/query/react/rtk-query-react.modern.mjs',
//     ignore: ignoreAll,
//   },
// ]

// module.exports = entryPoints
//   .flatMap((e) =>
//     esmSuffixes.map((suffix) => ({
//       ...e,
//       name: e.name + ` (${suffix})`,
//       modifyWebpackConfig: withRtkPath(suffix),
//     })),
//   )
//   .concat(
//     entryPoints.flatMap((e) =>
//       cjsSuffixes.map((suffix) => ({
//         ...e,
//         name: e.name + ` (cjs, ${suffix})`,
//         modifyWebpackConfig: withRtkPath(suffix, true),
//       })),
//     ),
//   )
//   .concat(
//     [
//       {
//         name: `3. createSlice`,
//         // import: '{ createSlice }',
//         import: { '@reduxjs/toolkit': '{ createSlice }' },
//       },
//       {
//         name: `3. createAsyncThunk`,
//         // import: '{ createAsyncThunk }',
//         import: { '@reduxjs/toolkit': '{ createAsyncThunk }' },
//       },
//       {
//         name: `3. buildCreateSlice and asyncThunkCreator`,
//         // import: '{ buildCreateSlice, asyncThunkCreator }',
//         import: {
//           '@reduxjs/toolkit': '{ buildCreateSlice, asyncThunkCreator }',
//         },
//       },
//       {
//         name: `3. createEntityAdapter`,
//         // path: '@reduxjs/toolkit',
//         // import: '{ createEntityAdapter }',
//         import: { '@reduxjs/toolkit': '{ createEntityAdapter }' },
//       },
//       {
//         name: `3. configureStore`,
//         import: { '@reduxjs/toolkit': '{ configureStore }' },
//       },
//       {
//         name: `3. combineSlices`,
//         import: { '@reduxjs/toolkit': '{ combineSlices }' },
//       },
//       {
//         name: `3. createDynamicMiddleware`,
//         import: { '@reduxjs/toolkit': '{ createDynamicMiddleware }' },
//       },
//       {
//         name: `3. createDynamicMiddleware (react)`,
//         import: { '@reduxjs/toolkit/react': '{ createDynamicMiddleware }' },
//       },
//       {
//         name: `3. createListenerMiddleware`,
//         import: { '@reduxjs/toolkit': '{ createListenerMiddleware }' },
//       },
//       {
//         name: `3. createApi`,
//         // path: '@reduxjs/toolkit/query',
//         import: { '@reduxjs/toolkit/query': '{ createApi }' } ,
//       },
//       {
//         name: `3. createApi (react)`,
//         // path: '@reduxjs/toolkit/query/react',
//         import: { '@reduxjs/toolkit/query/react': '{ createApi }' },
//       },
//       {
//         name: `3. fetchBaseQuery`,
//         // path: '@reduxjs/toolkit/query',
//         import: { '@reduxjs/toolkit/query': '{ fetchBaseQuery }' },
//       },
//     ]
//     .map((e) => ({
//       ...e,
//       name: e.name + ` (.modern.mjs)`,
//       modifyWebpackConfig: withRtkPath('modern.mjs'),
//     }))
//   )

const entryPoints = [
  {
    prefix: 'redux-toolkit',
    folder: '',
  },
  {
    prefix: 'redux-toolkit-react',
    folder: 'react',
  },
  {
    prefix: 'rtk-query',
    folder: 'query',
  },
  {
    prefix: 'rtk-query-react',
    folder: 'query/react',
  },
]

const ESMEntries = entryPoints
  .map(({ folder, prefix }) => `dist/${folder}/${prefix}.modern.mjs`)
  .map((e) => ({ name: `1. ESM entry point: ${e}`, path: e, import: '*' }))

const CJSEntries = entryPoints
  .map(({ folder, prefix }) => `dist/${folder}/cjs/index.js`)
  .map((e) => ({ name: `1. CJS entry point: ${e}`, path: e, import: '*' }))

const minifiedProductionEntries = entryPoints
  .map(
    ({ folder, prefix }) => `dist/${folder}/cjs/${prefix}.production.min.cjs`,
  )
  .map((e) => ({
    name: `1. Production entry point: ${e}`,
    path: e,
    import: '*',
  }))

const allEntries = ESMEntries.concat(CJSEntries).concat(
  minifiedProductionEntries,
)

// const allEntriesWithoutDependencies = allEntries.map(
//   ({ name, import: imported, path }) => ({
//     name: `${name} (Without Dependencies)`,
//     path,
//     import: imported,
//     ignore: ignoreAll,
//   }),
// )

// const entries = Object.entries(require('./package.json').exports).filter(
//   ([key, value]) => key !== './package.json',
// )

// const cjsEntryPoints = entries.map(([key, value]) => value.default.substring(2))

// const allImports = entries.map(([key, value]) => value.import.substring(2))

/**
 * @param entryPoint
 */
const getAllImports = async (entryPoint: string): Promise<SizeLimitConfig> => {
  const mainEntry = [
    {
      name: `1. ${entryPoint.endsWith('.js') ? 'CJS' : 'Production'} entry point: ${entryPoint}`,
      path: entryPoint,
      import: '*',
    },
  ]

  if (entryPoint.endsWith('.modern.mjs')) {
    const module = await import(`./${entryPoint}`)

    return Object.keys(module)
      .map<Check>((e) => ({
        name: `${e} (${entryPoint})`,
        path: entryPoint,
        import: `{ ${e} }`,
      }))
      .concat({
        name: `1. ESM entry point: ${entryPoint}`,
        path: entryPoint,
        import: '*',
      })
      .concat({
        name: `1. ESM entry point: ${entryPoint} (Without Dependencies)`,
        path: entryPoint,
        import: '*',
        ignore: ignoreAll,
      })
  }

  return mainEntry
}

const config = (async () =>
  (
    await Promise.all(
      allEntries.map(async ({ path }) => await getAllImports(path)),
    )
  ).flat())()
// .flat()
// .concat(
//   cjsEntryPoints
//     .map((e) => ({
//       name: `1. CJS entry point: ${e}`,
//       path: e,
//       import: '*',
//     }))
//     .concat([
//       {
//         name: '1. entry point: redux-toolkit.modern.mjs',
//         path: 'dist/redux-toolkit.modern.mjs',
//         import: '*',
//       },
//       {
//         name: '1. entry point: redux-toolkit.production.min.cjs',
//         path: 'dist/cjs/redux-toolkit.production.min.cjs',
//         import: '*',
//       },
//       {
//         name: '1. entry point: redux-toolkit-react.production.min.cjs',
//         path: 'dist/react/cjs/redux-toolkit-react.production.min.cjs',
//         import: '*',
//       },
//       {
//         name: '1. entry point: rtk-query.production.min.cjs',
//         path: 'dist/query/cjs/rtk-query.production.min.cjs',
//         import: '*',
//       },
//       {
//         name: '1. entry point: rtk-query-react.production.min.cjs',
//         path: 'dist/query/react/cjs/rtk-query-react.production.min.cjs',
//         import: '*',
//       },
//     ]),
// )

// console.log(
//   config
//     .then((e) => e)
//     .then((f) =>
//       f.forEach((r) => {
//         console.log(typeof r === 'object')
//       }),
//     ),
// )
// const config = (async () => {
//   const toolkit = await import('./dist/redux-toolkit.modern.mjs')
//   const react = await import('./dist/react/redux-toolkit-react.modern.mjs')
//   const query = await import('./dist/query/rtk-query.modern.mjs')
//   const reactQuery = await import(
//     './dist/query/react/rtk-query-react.modern.mjs'
//   )
//   return Object.keys(toolkit)
//     .map((e) => ({
//       name: `${e} (modern.mjs)`,
//       path: 'dist/redux-toolkit.modern.mjs',
//       import: `{ ${e} }`,
//     }))
//     .concat(
//       Object.keys(react).map((e) => ({
//         name: `${e} (react) (modern.mjs)`,
//         path: 'dist/react/redux-toolkit-react.modern.mjs',
//         import: `{ ${e} }`,
//       })),
//     )
//     .concat(
//       Object.keys(query).map((e) => ({
//         name: `${e} (query) (modern.mjs)`,
//         path: 'dist/query/rtk-query.modern.mjs',
//         import: `{ ${e} }`,
//       })),
//     )
//     .concat(
//       Object.keys(reactQuery).map((e) => ({
//         name: `${e} (rtk-query) (modern.mjs)`,
//         path: 'dist/query/react/rtk-query-react.modern.mjs',
//         import: `{ ${e} }`,
//       })),
//     )
// })()
// console.log(config.then((e) => console.log(e)))
export default config
