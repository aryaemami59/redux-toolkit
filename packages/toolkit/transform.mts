import fs from 'node:fs/promises'
import path from 'node:path'

const files = ['', 'react', 'query', 'query/react']

const fullPaths = files.map((file) => path.resolve('dist', file, 'index.d.ts'))

const map = new Map(
  await Promise.all(
    fullPaths.map(
      async (file) => [file, await fs.readFile(file, 'utf-8')] as const,
    ),
  ),
)

const exportedUniqueSymbols = new Set()

map.forEach(async (content, filePath) => {
  const lines = content.split('\n')

  const allUniqueSymbols = lines
    .filter((line) => /declare const (\w+)\: unique symbol;/.test(line))
    .map((line) => line.match(/declare const (\w+)\: unique symbol;/)?.[1])

  const allNamedExports = lines
    .at(-2)
    ?.match(/export \{ (.*) \}/)?.[1]
    .split(', ')

  allNamedExports?.forEach((e) => {
    if (allUniqueSymbols.includes(e)) {
      exportedUniqueSymbols.add(e)
    }
  })

  let newContent = `${lines.slice(0, -2).join('\n')}export { ${allNamedExports?.filter((e) => !exportedUniqueSymbols.has(e)).join(', ')} }`

  exportedUniqueSymbols.forEach(async (uniqueSymbol) => {
    newContent = newContent.replace(
      `declare const ${uniqueSymbol}`,
      `export declare const ${uniqueSymbol}`,
    )

    await fs.writeFile(filePath, newContent)
  })
})
