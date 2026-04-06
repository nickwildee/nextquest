import { FlatCompat } from '@eslint/eslintrc'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import boundaries from 'eslint-plugin-boundaries'
import pluginImport from 'eslint-plugin-import'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({ baseDirectory: __dirname })

/** @type {import('typescript-eslint').Config} */
const config = [
  ...compat.extends('next/core-web-vitals'),
  ...tseslint.configs.recommended,
  ...compat.extends('turbo'),
  {
    plugins: {
      import: pluginImport,
      boundaries,
    },
    settings: {
      'boundaries/elements': [
        { type: 'app',      pattern: ['src/app', 'app'] },
        { type: 'widgets',  pattern: ['src/widgets', 'widgets'] },
        { type: 'features', pattern: ['src/features', 'features'] },
        { type: 'entities', pattern: ['src/entities', 'entities'] },
        { type: 'shared',   pattern: ['src/shared', 'shared'] },
      ],
      'boundaries/ignore': ['**/*.test.*', '**/*.spec.*', '**/*.stories.*'],
    },
    rules: {
      // FSD 단방향 의존성
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'app',      allow: ['widgets', 'features', 'entities', 'shared'] },
            { from: 'widgets',  allow: ['features', 'entities', 'shared'] },
            { from: 'features', allow: ['entities', 'shared'] },
            { from: 'entities', allow: ['shared'] },
            { from: 'shared',   allow: [] },
          ],
        },
      ],

      // 슬라이스 간 교차 import 금지 (같은 레이어 내)
      'boundaries/no-unknown': 'error',

      // import 정렬
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
    },
  },

  // prettier 충돌 규칙 off (반드시 마지막)
  prettierConfig,
]

export default config
