import type { Node, NodePath } from '@babel/core'
import * as babel from '@babel/core'
import { generate } from '@babel/generator'
import { declare } from '@babel/helper-plugin-utils'
import type {
  CallExpression,
  Function,
  Identifier,
  MemberExpression,
  Statement,
  TSSymbolKeyword,
  TSTypeAnnotation,
  TSTypeOperator,
  VariableDeclaration,
  VariableDeclarator,
} from '@babel/types'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import type { InlineConfig, Rolldown, UserConfig } from 'tsdown'
import { defineConfig } from 'tsdown'
import packageJson from './package.json' with { type: 'json' }
import type {
  BabelPluginResult,
  MangleErrorsPluginOptions,
} from './scripts/mangleErrors.mjs'
import { mangleErrorsPlugin } from './scripts/mangleErrors.mjs'
import type { Id } from './src/tsHelpers.js'

const cwd = import.meta.dirname

const packageJsonPath = path.join(cwd, 'package.json')

const sourceRootDirectory = path.join(cwd, 'src')

const RE_NODE_MODULES = /node_modules/

const RE_TS = /\.([cm]?)tsx?$/

const RE_DTS = /\.d\.([cm]?)ts$/

/**
 * Rolldown plugin to emit a CommonJS entry file that switches between
 * development and production bundles based on `NODE_ENV`.
 *
 * Automatically derives the folder and prefix from the output chunk filenames.
 * Only acts on production CJS builds (chunks ending in `.production.min.cjs`).
 *
 * @returns A Rolldown plugin that emits the CJS entry file.
 * @internal
 */
const writeCommonJSEntryPlugin = (): Rolldown.Plugin => ({
  name: 'write-commonjs-entry',
  generateBundle: {
    handler(_outputOptions, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (
          chunk.type === 'chunk' &&
          chunk.isEntry &&
          fileName.endsWith('.production.min.cjs')
        ) {
          const dir = path.dirname(fileName)
          const prefix = path.basename(fileName, '.production.min.cjs')
          this.emitFile({
            type: 'asset',
            fileName: `${dir}/index.js`,
            source: `"use strict";
if (process.env.NODE_ENV === "production") {
  module.exports = require("./${prefix}.production.min.cjs");
} else {
  module.exports = require("./${prefix}.development.cjs");
}`,
          })
        }
      }
    },
  },
})

/**
 * @internal
 */
type GenerateBundleObjectHook = Id<
  Pick<
    Extract<
      NonNullable<Rolldown.Plugin['generateBundle']>,
      { handler: unknown }
    >,
    'order'
  >
>

/**
 * Extract error strings, replace them with error codes, and write messages to
 * a file.
 *
 * @param [mangleErrorsPluginOptions] - Options forwarded to the `mangleErrorsPlugin`. Supported options include `minify` to indicate whether error messages should be further minified.
 * @returns A Rolldown plugin that applies the Babel transformation to TypeScript/TSX sources matching the configured filter and returns transformed code and source maps.
 * @internal
 */
const mangleErrorsTransform = (
  mangleErrorsPluginOptions: MangleErrorsPluginOptions = {},
): Rolldown.Plugin => {
  const { minify = false } = mangleErrorsPluginOptions

  return {
    name: 'mangle-errors-plugin',
    transform: {
      filter: {
        code: {
          include: ['throw'],
        },
        id: {
          exclude: [RE_DTS, RE_NODE_MODULES],
          include: [RE_TS],
        },
        moduleType: {
          include: ['ts', 'tsx'],
        },
      },

      async handler(code, id, meta) {
        const combinedSourcemap = this.getCombinedSourcemap()

        try {
          const res = await babel.transformAsync(code, {
            cwd,
            filename: id,
            filenameRelative: path.relative(sourceRootDirectory, id),
            inputSourceMap: combinedSourcemap,
            parserOpts: {
              plugins: ['typescript', 'jsx'],
              sourceFilename: id,
              sourceType: 'module',
            },
            plugins: [
              [
                mangleErrorsPlugin,
                { minify } satisfies MangleErrorsPluginOptions,
              ],
            ],
            sourceFileName: id,
            sourceMaps: 'both',
            sourceType: 'module',
          })

          if (res == null) {
            throw new Error('Babel transformAsync returned null')
          }

          return {
            code: res.code ?? code,
            invalidate: true,
            map: res.map ?? combinedSourcemap,
            meta,
            moduleSideEffects: false,
            moduleType: meta.moduleType,
            packageJsonPath,
          }
        } catch (err) {
          console.error('Babel mangleErrors error: ', err)
          return null
        }
      },
    },
  }
}

/**
 * Rolldown plugin to remove generated CommonJS (.cjs) JavaScript outputs
 * from DTS-only builds. When generating type definition builds we may still
 * emit stray .cjs files; this plugin deletes those entries from the
 * generated bundle to ensure only declaration artifacts remain.
 *
 * @param [pluginOptions] - Options forwarded to the plugin.
 * @returns A Rolldown plugin that prunes .cjs files from the bundle.
 * @internal
 */
const removeCJSOutputsFromDTSBuilds = (
  pluginOptions: GenerateBundleObjectHook = {},
): Rolldown.Plugin => {
  return {
    name: 'remove-cjs-outputs-from-dts-builds',
    generateBundle: {
      order: pluginOptions.order ?? null,
      handler(outputOptions, bundle, isWrite) {
        Object.entries(bundle).forEach(([fileName]) => {
          if (
            outputOptions.format === 'cjs' &&
            isWrite &&
            (fileName.endsWith('index.cjs') ||
              fileName.endsWith('index.cjs.map'))
          ) {
            delete bundle[fileName]
          }
        })
      },
    },
  }
}

/**
 * Rolldown plugin to remove multi-line JSDoc-style comments from source
 * files while preserving single-line pure annotations (e.g. `@__PURE__` or
 * `#__PURE__`). This helps reduce bundle size by stripping documentation
 * comments that are not needed at runtime.
 *
 * @returns A Rolldown plugin that removes multi-line comments.
 * @internal
 */
const removeComments = (): Rolldown.Plugin => {
  return {
    name: 'remove-comments',
    transform: {
      filter: {
        code: {
          include: [/\/\*\*\n/],
        },
        id: {
          exclude: [RE_NODE_MODULES],
          include: [RE_TS],
        },
        moduleType: {
          include: ['ts', 'tsx'],
        },
      },
      async handler(code, id, meta) {
        const combinedSourcemap = this.getCombinedSourcemap()

        const transformResult = await babel.transformAsync(code, {
          cwd,
          filename: id,
          filenameRelative: path.relative(sourceRootDirectory, id),
          inputSourceMap: combinedSourcemap,
          parserOpts: {
            plugins: [['typescript', {}], 'jsx'],
            sourceFilename: id,
            sourceType: 'module',
          },
          shouldPrintComment: (commentContents) => {
            if (
              commentContents.includes('\n') ||
              !/^\s?[@#]__PURE__\s?$/.test(commentContents)
            ) {
              return false
            }

            return true
          },
          sourceFileName: id,
          sourceMaps: 'both',
          sourceType: 'module',
        })

        if (transformResult == null) {
          return null
        }

        return {
          code: transformResult.code ?? code,
          invalidate: true,
          map: transformResult.map ?? combinedSourcemap,
          meta,
          moduleSideEffects: false,
          moduleType: meta.moduleType,
          packageJsonPath,
        }
      },
    },
  }
}

/**
 * @internal
 */
const DEFAULT_PURE_ANNOTATION = '@__PURE__'

/**
 * @internal
 */
const isPureAnnotated = ({ leadingComments }: Node): boolean =>
  !!leadingComments?.some((comment) => /[@#]__PURE__/.test(comment.value))

/**
 * @internal
 */
const annotateAsPure = (nodePath: NodePath): void => {
  if (isPureAnnotated(nodePath.node)) {
    return
  }

  nodePath.addComment('leading', DEFAULT_PURE_ANNOTATION, false)
}

/**
 * @internal
 */
type AnnotateAsPurePluginOptions = Id<
  GenerateBundleObjectHook & {
    /**
     * A list of call expression method names to annotate as pure.
     *
     * @default []
     */
    callExpressions?: string[] | undefined
  }
>

/**
 * @internal
 */
type AnnotateAsPurePluginResult = BabelPluginResult<
  AnnotateAsPurePluginOptions,
  'annotate-as-pure'
>

/**
 * @internal
 */
const hasCallableParent = <NodePathType extends NodePath>(
  nodePath: NodePathType,
): nodePath is NodePathType & { parentPath: NodePath<CallExpression> } =>
  nodePath.parentPath != null &&
  (nodePath.parentPath.isCallExpression() ||
    nodePath.parentPath.isNewExpression())

/**
 * @internal
 */
const isUsedAsCallee = <
  NodePathType extends NodePath<CallExpression | Function>,
>(
  nodePath: NodePathType,
): nodePath is NodePathType & { parentPath: NodePath<CallExpression> } =>
  hasCallableParent(nodePath) && nodePath.parentPath.get('callee') === nodePath

/**
 * @internal
 */
function isInCallee(nodePath: NodePath<CallExpression>): boolean {
  do {
    nodePath = nodePath.parentPath as NodePath<CallExpression>

    if (isUsedAsCallee(nodePath)) {
      return true
    }
  } while (!nodePath.isStatement() && !nodePath.isFunction())

  return false
}

/**
 * @internal
 */
const isExecutedDuringInitialization = (
  nodePath: NodePath<CallExpression>,
): boolean => {
  let functionParent: NodePath<Function> | null = nodePath.getFunctionParent()

  while (functionParent) {
    if (!isUsedAsCallee(functionParent)) {
      return false
    }

    functionParent = functionParent.getFunctionParent()
  }

  return true
}

/**
 * @internal
 */
const isInAssignmentContext = (nodePath: NodePath<CallExpression>): boolean => {
  const statement: NodePath<Statement> | null = nodePath.getStatementParent()
  let parentPath: NodePath | null = null

  do {
    ;({ parentPath } = parentPath || nodePath)

    if (
      parentPath != null &&
      (parentPath.isVariableDeclaration() ||
        parentPath.isAssignmentExpression() ||
        parentPath.isClass())
    ) {
      return true
    }
  } while (parentPath !== statement)

  return false
}

/**
 * @internal
 */
function callableExpressionVisitor(nodePath: NodePath<CallExpression>): void {
  if (
    isUsedAsCallee(nodePath) ||
    isInCallee(nodePath) ||
    !isExecutedDuringInitialization(nodePath) ||
    (!isInAssignmentContext(nodePath) &&
      !nodePath.getStatementParent()?.isExportDefaultDeclaration())
  ) {
    return
  }

  annotateAsPure(nodePath)
}

/**
 * @internal
 */
const annotateAsPureBabelPlugin = declare<
  AnnotateAsPurePluginOptions,
  AnnotateAsPurePluginResult
>((api, options = {}): AnnotateAsPurePluginResult => {
  const { types: t } = api

  const { callExpressions = [] } = options

  return {
    name: 'annotate-as-pure',
    visitor: {
      CallExpression(path: NodePath<CallExpression>) {
        if (callExpressions.length === 0) {
          return
        }

        const callee = path.get('callee')

        if (
          callee.isIdentifier() &&
          callExpressions.some((callExpression) =>
            callee.matchesPattern(callExpression),
          )
        ) {
          callableExpressionVisitor(path)
          // annotateAsPure(path)
        }
      },

      MemberExpression(path: NodePath<MemberExpression>) {
        if (callExpressions.length === 0) {
          return
        }

        const property = path.get('property')

        if (!property.isIdentifier()) {
          return
        }

        if (
          callExpressions.some((callExpression) => {
            if (path.matchesPattern(callExpression)) {
              return true
            }

            return false
          })
        ) {
          const statementParent = path.getStatementParent()

          if (statementParent == null) {
            return
          }

          if (
            statementParent.isReturnStatement() ||
            t.isVariableDeclaration(statementParent.node, { kind: 'const' }) ||
            (t.isExportNamedDeclaration(statementParent.node, {
              exportKind: 'value',
            }) &&
              t.isVariableDeclaration(statementParent.node.declaration, {
                kind: 'const',
              }))
          ) {
            annotateAsPure(path)
          }
        }
      },
    },
  }
})

/**
 * @internal
 */
const ANNOTATE_AS_PURE_PLUGIN_OPTIONS_DEFAULTS = {
  callExpressions: [],
  order: null,
} as const satisfies Required<AnnotateAsPurePluginOptions>

/**
 * @internal
 */
const annotateAsPurePlugin = (
  annotateAsPurePluginOptions: AnnotateAsPurePluginOptions = {},
): Rolldown.Plugin => {
  const { callExpressions = [], order = null } = {
    ...ANNOTATE_AS_PURE_PLUGIN_OPTIONS_DEFAULTS,
    ...annotateAsPurePluginOptions,
  } as const satisfies Required<AnnotateAsPurePluginOptions>

  return {
    name: 'annotate-as-pure',
    transform: {
      filter: {
        id: {
          exclude: [RE_DTS, RE_NODE_MODULES],
          include: [RE_TS],
        },
        moduleType: {
          include: ['ts', 'tsx'],
        },
      },
      order,
      async handler(code, id, meta) {
        const combinedSourcemap = this.getCombinedSourcemap()

        const transformResult = await babel.transformAsync(code, {
          cwd,
          filename: id,
          filenameRelative: path.relative(sourceRootDirectory, id),
          inputSourceMap: combinedSourcemap,
          parserOpts: {
            plugins: [['typescript', {}], 'jsx'],
            sourceFilename: id,
            sourceType: 'module',
          },
          plugins: [
            [
              annotateAsPureBabelPlugin,
              {
                callExpressions,
              } as const satisfies Required<
                Pick<AnnotateAsPurePluginOptions, 'callExpressions'>
              >,
            ],
          ],
          sourceFileName: id,
          sourceMaps: 'both',
          sourceType: 'module',
        })

        if (transformResult == null) {
          return null
        }

        return {
          code: transformResult.code ?? code,
          invalidate: true,
          map: transformResult.map ?? combinedSourcemap,
          meta,
          moduleSideEffects: false,
          moduleType: meta.moduleType,
          packageJsonPath,
        }
      },
    },
  }
}

/**
 * Represents a `const` variable declaration whose identifier is annotated with
 * the {@linkcode https://www.typescriptlang.org/docs/handbook/symbols.html#unique-symbol | unique symbol}
 * type in a TypeScript declaration file (`.d.ts`).
 *
 * @example
 * <caption>Top-level unique symbol declaration</caption>
 *
 * ```ts
 * declare const skipToken: unique symbol;
 * ```
 *
 * @internal
 */
type UniqueSymbolVariableDeclaration = Id<
  VariableDeclaration & {
    declarations: [
      variableDeclarator: VariableDeclarator & {
        id: Identifier & {
          typeAnnotation: TSTypeAnnotation & {
            typeAnnotation: TSTypeOperator & {
              operator: 'unique'
              typeAnnotation: TSSymbolKeyword
            }
          }
        }
      },
      ...VariableDeclarator[],
    ]
    declare: true
    kind: 'const'
  }
>

/**
 * Rolldown plugin to fix unique symbol exports in TypeScript declaration files.
 *
 * TypeScript has issues with re-exporting unique symbols in barrel exports.
 * This plugin uses Babel to parse the AST, identify unique symbol declarations,
 * remove them from export statements, and convert them to individual export
 * declarations (e.g., `export declare const X: unique symbol`).
 *
 * @param [pluginOptions] - Options forwarded to the plugin.
 * @returns A Rolldown plugin that fixes unique symbol exports in .d.ts files.
 * @internal
 */
const fixUniqueSymbolExports = (
  pluginOptions: GenerateBundleObjectHook = {},
): Rolldown.Plugin => {
  const { types: t } = babel

  const exportedUniqueSymbolsMap = new Map<string, Set<string>>()
  const processedFiles = new Set<string>()

  return {
    name: 'fix-unique-symbol-exports',
    renderChunk: {
      order: pluginOptions.order ?? null,
      async handler(code, chunk, _outputOptions, _meta) {
        if (!RE_DTS.test(chunk.fileName) || !chunk.isEntry) {
          return
        }

        const parsedFile = await babel.parseAsync(code, {
          ast: true,
          cwd,
          filename: chunk.fileName,
          filenameRelative: path.relative(sourceRootDirectory, chunk.fileName),
          parserOpts: {
            errorRecovery: true,
            plugins: [['typescript', { dts: true }]],
            ranges: true,
            sourceFilename: chunk.fileName,
            sourceType: 'module',
          },
          sourceFileName: chunk.fileName,
          sourceMaps: 'both',
          sourceType: 'module',
        })

        if (parsedFile == null) {
          return null
        }

        const allUniqueSymbols = new Set<string>()
        const exportedUniqueSymbols = new Set<string>()

        const isUniqueSymbolDeclaration = <StatementType extends Statement>(
          statement: StatementType,
        ): statement is Id<StatementType & UniqueSymbolVariableDeclaration> =>
          t.isVariableDeclaration(statement, {
            declare: true,
            kind: 'const',
          }) &&
          t.isIdentifier(statement.declarations[0].id) &&
          t.isTSTypeAnnotation(statement.declarations[0].id.typeAnnotation) &&
          t.isTSTypeOperator(
            statement.declarations[0].id.typeAnnotation.typeAnnotation,
            { operator: 'unique' },
          ) &&
          t.isTSSymbolKeyword(
            statement.declarations[0].id.typeAnnotation.typeAnnotation
              .typeAnnotation,
          )

        // First pass: find all unique symbol declarations
        parsedFile.program.body.forEach((statement) => {
          if (isUniqueSymbolDeclaration(statement)) {
            allUniqueSymbols.add(statement.declarations[0].id.name)
          }
        })

        // Second pass: find which ones are in the export list
        parsedFile.program.body.forEach((statement) => {
          if (t.isExportNamedDeclaration(statement)) {
            statement.specifiers.forEach((spec) => {
              if (
                t.isExportSpecifier(spec) &&
                t.isIdentifier(spec.local) &&
                allUniqueSymbols.has(spec.local.name)
              ) {
                exportedUniqueSymbols.add(spec.local.name)
              }
            })

            // Remove exported unique symbols from the export specifier list
            statement.specifiers = statement.specifiers.filter(
              (exportSpecifier) => {
                if (
                  t.isExportSpecifier(exportSpecifier) &&
                  exportSpecifier.exportKind === 'value' &&
                  t.isIdentifier(exportSpecifier.local) &&
                  t.isIdentifier(exportSpecifier.exported) &&
                  exportedUniqueSymbols.has(exportSpecifier.local.name)
                ) {
                  return false
                }

                return true
              },
            )
          }
        })

        exportedUniqueSymbolsMap.set(chunk.fileName, exportedUniqueSymbols)

        // Convert unique symbol declarations to export declarations
        parsedFile.program.body = parsedFile.program.body.map((statement) => {
          if (
            isUniqueSymbolDeclaration(statement) &&
            exportedUniqueSymbols.has(statement.declarations[0].id.name)
          ) {
            console.log(
              `  Exporting '${statement.declarations[0].id.name}' as individual export`,
            )
            return t.exportNamedDeclaration(statement)
          }

          return statement
        })

        if (exportedUniqueSymbols.size > 0) {
          console.log(
            `Fixing unique symbol exports in ${chunk.fileName} (${exportedUniqueSymbols.size} symbols)`,
          )
        }

        const generatedResults = generate(parsedFile, {
          comments: true,
          sourceMaps: true,
          sourceFileName: chunk.fileName,
        })

        processedFiles.add(chunk.fileName)

        return {
          code: generatedResults.code,
          map: generatedResults.map,
        }
      },
    },

    // Fallback for .d.ts files that don't go through renderChunk
    async writeBundle(outputOptions) {
      const outDir = outputOptions.dir || path.dirname(outputOptions.file || '')

      const entryPointDirectories = ['', 'react', 'query', 'query/react']

      const dtsFiles = entryPointDirectories.map((filePath) =>
        path.join(outDir, filePath, 'index.d.ts'),
      )

      for (const filePath of dtsFiles) {
        const relativePath = path.relative(outDir, filePath)

        // Skip if already processed by renderChunk
        if (processedFiles.has(relativePath)) {
          continue
        }

        try {
          const content = await fs.readFile(filePath, { encoding: 'utf-8' })

          const parsedFile = await babel.parseAsync(content, {
            ast: true,
            cwd,
            filename: relativePath,
            filenameRelative: path.relative(sourceRootDirectory, relativePath),
            parserOpts: {
              errorRecovery: true,
              plugins: [['typescript', { dts: true }]],
              ranges: true,
              sourceFilename: relativePath,
              sourceType: 'module',
            },
            sourceFileName: relativePath,
            sourceMaps: false,
            sourceType: 'module',
          })

          if (parsedFile == null) {
            continue
          }

          const allUniqueSymbols = new Set<string>()
          const exportedUniqueSymbols = new Set<string>()

          const isUniqueSymbolDeclaration = <StatementType extends Statement>(
            statement: StatementType,
          ): statement is Id<StatementType & UniqueSymbolVariableDeclaration> =>
            t.isVariableDeclaration(statement, {
              declare: true,
              kind: 'const',
            }) &&
            t.isIdentifier(statement.declarations[0].id) &&
            t.isTSTypeAnnotation(statement.declarations[0].id.typeAnnotation) &&
            t.isTSTypeOperator(
              statement.declarations[0].id.typeAnnotation.typeAnnotation,
              { operator: 'unique' },
            ) &&
            t.isTSSymbolKeyword(
              statement.declarations[0].id.typeAnnotation.typeAnnotation
                .typeAnnotation,
            )

          // Find all unique symbol declarations
          parsedFile.program.body.forEach((statement) => {
            if (isUniqueSymbolDeclaration(statement)) {
              allUniqueSymbols.add(statement.declarations[0].id.name)
            }
          })

          if (allUniqueSymbols.size === 0) {
            continue
          }

          // Check which unique symbols are actually in the export list
          parsedFile.program.body.forEach((statement) => {
            if (t.isExportNamedDeclaration(statement)) {
              statement.specifiers.forEach((spec) => {
                if (
                  t.isExportSpecifier(spec) &&
                  t.isIdentifier(spec.local) &&
                  allUniqueSymbols.has(spec.local.name)
                ) {
                  exportedUniqueSymbols.add(spec.local.name)
                }
              })
            }
          })

          if (exportedUniqueSymbols.size === 0) {
            continue
          }

          console.log(
            `Fixing unique symbol exports in ${relativePath} via writeBundle`,
          )

          // Remove unique symbols from export specifiers
          parsedFile.program.body = parsedFile.program.body.map((statement) => {
            if (t.isExportNamedDeclaration(statement)) {
              statement.specifiers = statement.specifiers.filter((spec) => {
                if (
                  t.isExportSpecifier(spec) &&
                  t.isIdentifier(spec.local) &&
                  exportedUniqueSymbols.has(spec.local.name)
                ) {
                  console.log(
                    `  Exporting '${spec.local.name}' as individual export`,
                  )
                  return false
                }
                return true
              })
            }
            return statement
          })

          // Convert declarations to export declarations
          parsedFile.program.body = parsedFile.program.body.map((statement) => {
            if (
              isUniqueSymbolDeclaration(statement) &&
              exportedUniqueSymbols.has(statement.declarations[0].id.name)
            ) {
              return t.exportNamedDeclaration(statement)
            }
            return statement
          })

          const generatedResults = generate(parsedFile, {
            comments: true,
            sourceMaps: false,
          })

          await fs.writeFile(filePath, generatedResults.code, {
            encoding: 'utf-8',
          })

          processedFiles.add(relativePath)
        } catch (error) {
          if (
            !(
              error instanceof Error &&
              'code' in error &&
              error.code === 'ENOENT'
            )
          ) {
            console.error(`Error processing ${relativePath}:`, error)
          }
        }
      }
    },
  }
}

const peerAndProductionDependencies = Object.keys({
  ...packageJson.dependencies,
  ...packageJson.peerDependencies,
} as const) satisfies Extract<NonNullable<InlineConfig['external']>, unknown[]>

export default defineConfig((cliOptions) => {
  const commonOptions = {
    clean: false,
    cwd,
    devtools: {
      clean: false,
      enabled: true,
    },
    dts: false,
    external: [...peerAndProductionDependencies, /uncheckedindexed/],
    failOnWarn: true,
    fixedExtension: false,
    format: ['cjs', 'es'],
    hash: false,
    inlineOnly: [],
    inputOptions: (options, format) => ({
      ...options,
      experimental: {
        ...options.experimental,
        lazyBarrel: true,
        ...(format === 'cjs'
          ? {
              attachDebugInfo: 'none',
            }
          : {}),
        nativeMagicString: true,
      },
      transform: {
        ...options.transform,
        inject: {
          ...options.transform?.inject,
          'Object.assign': [
            path.join(sourceRootDirectory, 'bundle-size-utils.ts'),
            '__assign',
          ] as const,
          React: ['react', '*'] as const,
        },
      },
    }),
    nodeProtocol: true,
    outDir: 'dist',
    outExtensions: ({ format, options }) => ({
      dts: format === 'es' ? '.d.mts' : '.d.ts',
      js:
        format === 'es'
          ? (Array.isArray(options.transform?.target) &&
              options.transform?.target.includes('es2017')) ||
            options.transform?.target === 'es2017'
            ? '.legacy-esm.js'
            : `${options.platform === 'browser' ? '.browser' : '.modern'}.mjs`
          : '.cjs',
    }),
    outputOptions: (options, format, context) => ({
      ...options,
      codeSplitting: false,
      ...(format === 'cjs' && !context.cjsDts
        ? {
            externalLiveBindings: false,
            intro: '"use strict";',
          }
        : {}),
      legalComments: 'none',
    }),
    platform: 'node',
    plugins: [
      removeComments(),
      mangleErrorsTransform(),
      annotateAsPurePlugin({
        callExpressions: ['__assign', 'Object.assign'],
      }),
      removeCJSOutputsFromDTSBuilds(),
      fixUniqueSymbolExports(),
      writeCommonJSEntryPlugin(),
    ],
    shims: true,
    sourcemap: true,
    target: ['esnext'],
    treeshake: {
      moduleSideEffects: false,
    },
    tsconfig: path.join(cwd, 'tsconfig.build.json'),
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
  } as const satisfies InlineConfig

  const modernEsmConfig = {
    ...commonOptions,
    format: ['es'],
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
    outExtensions: () => ({ js: '.production.min.cjs' }),
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
          from: path.join(sourceRootDirectory, 'uncheckedindexed.ts'),
          to: outDir,
          verbose: true,
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
    },

    {
      ...productionCjsConfig,
      name: 'Redux-Toolkit-React-CJS-Production',
      entry: {
        'react/cjs/redux-toolkit-react': 'src/react/index.ts',
      },
      external: [...peerAndProductionDependencies, packageJson.name],
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
      external: [
        ...sharedDTSConfig.external,
        packageJson.name,
        `${packageJson.name}/react`,
        `${packageJson.name}/query`,
      ],
    },
  ] as const satisfies UserConfig[]
})
