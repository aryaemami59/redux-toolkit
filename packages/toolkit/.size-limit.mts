import { Check, SizeLimitConfig } from 'size-limit'

const ignoreAll = [
  '@reduxjs/toolkit',
  '@reduxjs/toolkit/query',
  'immer',
  'redux',
  'reselect',
  'redux-thunk',
]

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
  .map((path) => ({
    name: `1. ESM entry point: ${path}`,
    path,
    import: '*',
  }))

const CJSEntries = entryPoints
  .map(({ folder }) => `dist/${folder}/cjs/index.js`)
  .map((path) => ({
    name: `1. CJS entry point: ${path}`,
    path,
    import: '*',
  }))

const minifiedProductionEntries = entryPoints
  .map(
    ({ folder, prefix }) => `dist/${folder}/cjs/${prefix}.production.min.cjs`,
  )
  .map((path) => ({
    name: `1. Production entry point: ${path}`,
    path,
    import: '*',
  }))

const allEntries = ESMEntries.concat(CJSEntries).concat(
  minifiedProductionEntries,
)

/**
 * Retrieves all imports for the specified entry point.
 *
 * @param entryPoint - The entry point file path.
 * @returns A promise that resolves to an array of SizeLimitConfig objects representing the imports.
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
export default config
