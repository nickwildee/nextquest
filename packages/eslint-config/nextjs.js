import nextPlugin from '@next/eslint-plugin-next'
import turboConfig from 'eslint-config-turbo/flat'
import boundaries from 'eslint-plugin-boundaries'
import pluginImport from 'eslint-plugin-import'
import tseslint from 'typescript-eslint'
import prettierConfig from 'eslint-config-prettier'

/** @type {import('typescript-eslint').Config} */
const config = [
  { ignores: ['.next/**', 'node_modules/**', 'dist/**'] },
  nextPlugin.configs['core-web-vitals'],
  ...tseslint.configs.recommended,
  ...turboConfig,
  {
    plugins: {
      import: pluginImport,
      boundaries,
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
      'boundaries/elements': [
        { type: 'app',      pattern: 'src/app/**' },
        { type: 'widgets',  pattern: 'src/widgets/**' },
        { type: 'features', pattern: 'src/features/**' },
        { type: 'entities', pattern: 'src/entities/**' },
        { type: 'shared',   pattern: 'src/shared/**' },
      ],
      'boundaries/ignore': ['**/*.test.*', '**/*.spec.*', '**/*.stories.*'],
    },
    rules: {
      // import 정렬: 외부 패키지 → 내부 FSD 레이어 순
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            { pattern: '@/app/**',      group: 'internal', position: 'before' },
            { pattern: '@/widgets/**',  group: 'internal', position: 'before' },
            { pattern: '@/features/**', group: 'internal', position: 'before' },
            { pattern: '@/entities/**', group: 'internal', position: 'before' },
            { pattern: '@/shared/**',   group: 'internal', position: 'before' },
          ],
          pathGroupsExcludedImportTypes: ['builtin', 'external'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // FSD 단방향 의존성 강제
      'boundaries/dependencies': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: { type: 'app' },      allow: [{ to: { type: 'widgets' } }, { to: { type: 'features' } }, { to: { type: 'entities' } }, { to: { type: 'shared' } }] },
            { from: { type: 'widgets' },  allow: [{ to: { type: 'features' } }, { to: { type: 'entities' } }, { to: { type: 'shared' } }] },
            { from: { type: 'features' }, allow: [{ to: { type: 'entities' } }, { to: { type: 'shared' } }] },
            { from: { type: 'entities' }, allow: [{ to: { type: 'shared' } }] },
            { from: { type: 'shared' },   allow: [] },
          ],
        },
      ],

      // 미등록 경로에서의 import 금지
      'boundaries/no-unknown': 'error',
    },
  },

  // prettier 충돌 규칙 off (반드시 마지막)
  prettierConfig,
]

export default config
