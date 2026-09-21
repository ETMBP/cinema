// ESLint flat config via eslint core's defineConfig (the tseslint.config()
// helper is deprecated). Keeps the two React guarantees the template's
// oxlint provided (rules-of-hooks, fast-refresh exports).
import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default defineConfig(
  // Never lint build output or this config file itself.
  { ignores: ['dist', 'eslint.config.js'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Sensible baselines: possible-bug catchers, not style opinions.
      js.configs.recommended,
      tseslint.configs.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Vite's fast refresh can only hot-swap files that export components
      // exclusively; this warns when a file would break that.
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],

      // Declaration order is a design decision, not a lint concern.
      // Never enable sorting rules or perfectionist-style plugins.
      'sort-imports': 'off',
      'sort-keys': 'off',
      'sort-vars': 'off',
      '@typescript-eslint/member-ordering': 'off',
    },
  },
);
