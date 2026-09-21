// @ts-check
import { defineConfig } from 'eslint/config';
import { base } from '../eslint.config.base.js';

export default defineConfig(...base, {
  languageOptions: {
    parserOptions: {
      // Type-aware linting: projectService reuses this package's own
      // tsconfig, so lint and compiler always agree about the types.
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
