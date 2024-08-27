import js from '@eslint/js'
import { Linter } from 'eslint'
import prettierConfig from 'eslint-config-prettier'

const ESLintConfig = [
  { name: 'ignores', ignores: ['**/'] },
  { name: 'javascript', ...js.configs.recommended },
  { name: 'prettier-config', ...prettierConfig },
] satisfies Linter.Config[]

export default ESLintConfig
