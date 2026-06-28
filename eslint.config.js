// Flat ESLint config — added in Wave 1 (infra parity with the database guide).
// Makes the long-standing "ESLint clean" convention real and enforceable.
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'dist-*',
      'node_modules',
      'Examples',
      'demo',
      'scripts/ssr',
      'scripts/_*',
      'scripts/**/*.mjs', // node-truth captures are run by hand, not linted
    ],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Match the database guide's proven rule set (the classic two hooks rules only).
      // We deliberately do NOT spread react-hooks' v7 'recommended' here — it enables
      // `set-state-in-effect`, which flags legitimate sim play/pause loops. Revisit in a later wave.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    // Node-run scripts (qa-integrity, test-*, vite config) use Node globals
    files: ['scripts/**/*.ts', 'vite.config.ts'],
    languageOptions: { globals: globals.node },
  },
);
