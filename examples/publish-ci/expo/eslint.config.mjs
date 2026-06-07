import js from '@eslint/js'
import prettierConfig from 'eslint-config-prettier/flat'
import jestPlugin from 'eslint-plugin-jest'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import reactXPlugin from 'eslint-plugin-react-x'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import { configs } from 'typescript-eslint'

const eslintConfig = defineConfig(
  {
    name: 'global-ignores',
    ignores: [
      '**/dist/',
      '**/build/',
      '**/lib/',
      '**/coverage/',
      '**/__snapshots__/',
      '**/temp/',
      '**/.temp/',
      '**/.tmp/',
      '**/.yalc/',
      '**/.yarn/',
      '**/.docusaurus/',
      '**/.next/',
      '**/.expo/',
      '**/*.snap',
    ],
  },
  {
    name: `${js.meta.name}/recommended`,
    ...js.configs.recommended,
  },
  {
    name: `${jestPlugin.meta.name}/recommended`,
    ...jestPlugin.configs['flat/recommended'],
  },
  reactHooksPlugin.configs.flat.recommended,
  {
    extends: [
      configs.strictTypeChecked,
      configs.stylisticTypeChecked,
      reactXPlugin.configs['strict-type-checked'],
    ],
    files: ['**/*.?(c|m)[t]s?(x)'],
    name: 'main',
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'no-undef': [0],
      'no-restricted-imports': [
        2,
        {
          paths: [
            {
              name: 'react-redux',
              importNames: ['useSelector', 'useStore', 'useDispatch'],
              message:
                'Please use pre-typed versions from `src/app/hooks.ts` instead.',
            },
          ],
        },
      ],
      '@typescript-eslint/consistent-type-definitions': [2, 'type'],
      '@typescript-eslint/consistent-type-imports': [
        2,
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
          disallowTypeAnnotations: true,
        },
      ],
      '@typescript-eslint/no-unsafe-assignment': [0],
      '@typescript-eslint/no-useless-default-assignment': [0],
    },

    linterOptions: {
      reportUnusedDisableDirectives: 2,
    },
  },
  {
    extends: [configs.disableTypeChecked],
    files: ['metro.config.js', 'babel.config.js'],
    name: 'commonjs-files',
    languageOptions: {
      sourceType: 'commonjs',
    },
    rules: {
      '@typescript-eslint/no-require-imports': [
        0,
        { allow: [], allowAsImport: false },
      ],
    },
  },

  prettierConfig,
)

export default eslintConfig
