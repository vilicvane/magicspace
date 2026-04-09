import mufan, {configs} from '@mufan/eslint-plugin';
import {defineConfig, globalIgnores} from 'eslint/config';

export default defineConfig([
  globalIgnores([
    'packages/core/bld/',
    'packages/cli/bld/',
    'packages/utils/bld/',
    'packages/boilerplate-url/bld/',
    'packages/boilerplate-url-resolver/bld/',
  ]),
  {
    files: ['**/*.{js,mjs,cjs}'],
    plugins: {'@mufan': mufan},
    extends: [configs.javascript],
  },
  {
    files: ['eslint.config.js'],
    plugins: {'@mufan': mufan},
    extends: [configs.dev],
  },
  // packages/core/src/library
  {
    files: ['packages/core/src/library/**/*.{ts,tsx}'],
    plugins: {'@mufan': mufan},
    extends: [configs.typescript],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // packages/cli/src/program
  {
    files: ['packages/cli/src/program/**/*.{ts,tsx}'],
    plugins: {'@mufan': mufan},
    extends: [configs.typescript],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // packages/utils/src/library
  {
    files: ['packages/utils/src/library/**/*.{ts,tsx}'],
    plugins: {'@mufan': mufan},
    extends: [configs.typescript],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // packages/utils/src/test
  {
    files: ['packages/utils/src/test/**/*.{ts,tsx}'],
    plugins: {'@mufan': mufan},
    extends: [configs.typescript, configs.dev],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // packages/boilerplate-url/src/library
  {
    files: ['packages/boilerplate-url/src/library/**/*.{ts,tsx}'],
    plugins: {'@mufan': mufan},
    extends: [configs.typescript],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // packages/boilerplate-url/src/composables
  {
    files: ['packages/boilerplate-url/src/composables/**/*.{ts,tsx}'],
    plugins: {'@mufan': mufan},
    extends: [configs.typescript],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // packages/boilerplate-url-resolver/src/program
  {
    files: ['packages/boilerplate-url-resolver/src/program/**/*.{ts,tsx}'],
    plugins: {'@mufan': mufan},
    extends: [configs.typescript],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
]);
