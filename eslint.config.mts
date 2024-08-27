import { createESLintConfig } from '@reduxjs/eslint-config'
import { configs } from 'typescript-eslint'

export default createESLintConfig([
  { name: 'ignores', ignores: ['**/'] },
  configs.disableTypeChecked,
])
