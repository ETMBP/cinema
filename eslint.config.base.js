// @ts-check
// Shared ESLint base for the Node-side packages (backend, shared). Each
// package's eslint.config.js composes this and adds its own type-aware
// parser setup. The frontend keeps its React-specific config separately.
// NOTE: this file is deliberately NOT named eslint.config.js - it is a
// building block, not a config ESLint discovers on its own.
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export const base = [
  // Never lint build output, or the config files themselves (plain JS,
  // outside the package tsconfigs that the type-checked rules rely on).
  { ignores: ['dist/', 'eslint.config.js'] },

  eslint.configs.recommended,
  // The type-AWARE rule sets: rules that can see real types, catching
  // unawaited promises, `any` leaking through calls, impossible
  // conditions - the bugs plain syntax linting cannot see.
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  {
    rules: {
      // `_`-prefixed = intentionally unused. The errorHandler's `_next`
      // must EXIST (express detects error handlers by 4-arity) while
      // never being used - this naming convention is how we say so.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Numbers interpolate into strings unambiguously - the rule's real
      // target is objects rendering as "[object Object]".
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        { allowNumber: true },
      ],
      // Declaration order is a design decision, not a lint concern.
      // The prototype's eslint-plugin-perfectionist ("recommended-natural")
      // was the alphabetizer - it is deliberately absent here, and no
      // sorting rule is ever to be enabled in this repo.
      'sort-imports': 'off',
      'sort-keys': 'off',
      'sort-vars': 'off',
    },
  },
];
