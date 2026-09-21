// @ts-check
import { defineConfig } from 'eslint/config';
import { base } from '../eslint.config.base.js';

export default defineConfig(...base, {
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
