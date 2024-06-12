#!/usr/bin/env node --import=tsx

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const entryPointDirectories = ['', 'react', 'query', 'query/react']

const typeDefinitionEntryFiles = entryPointDirectories.map((filePath) =>
  path.resolve(__dirname, '..', 'dist', filePath, 'index.d.ts'),
)

const filePathsToContentMap = new Map(
  await Promise.all(
    typeDefinitionEntryFiles.map(
      async (filePath) => [filePath, await fs.readFile(filePath, 'utf-8')] as const,
    ),
  ),
)

const exportedUniqueSymbols = new Set()

filePathsToContentMap.forEach(async (content, filePath) => {
  const lines = content.split('\n')

  const allUniqueSymbols = lines
    .filter((line) => /declare const (\w+)\: unique symbol;/.test(line))
    .map((line) => line.match(/declare const (\w+)\: unique symbol;/)?.[1])

  const allNamedExports = lines
    .at(-2)
    ?.match(/^export \{ (.*) \}$/)?.[1]
    .split(', ')

  allNamedExports?.forEach((namedExport) => {
    if (allUniqueSymbols.includes(namedExport)) {
      exportedUniqueSymbols.add(namedExport)
    }
  })

  let newContent = `${lines.slice(0, -2).join('\n')}\nexport { ${allNamedExports?.filter((namedExport) => !exportedUniqueSymbols.has(namedExport)).join(', ')} }\n`

  exportedUniqueSymbols.forEach(async (uniqueSymbol) => {
    newContent = newContent.replace(
      `declare const ${uniqueSymbol}`,
      `export declare const ${uniqueSymbol}`,
    )

    await fs.writeFile(filePath, `${newContent}\n`)
  })
})
