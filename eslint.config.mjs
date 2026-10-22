import js from '@eslint/js';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['tools/review-pilot/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
];
