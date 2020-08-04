import FS from 'fs';
import Path from 'path';

import {rules} from '../rules';

import {RuleTester, getTestsDirPath} from './@utils';

const TEST_DIR_PATH = getTestsDirPath('import-path-shallowest');

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
});

ruleTester.run('import-path-shallowest', rules['import-path-shallowest'], {
  valid: [
    {
      code: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'foo/test.ts.lint'),
      ).toString(),
      options: [
        {
          baseUrl: 'core',
        },
      ],
      filename: Path.join(TEST_DIR_PATH, 'foo/test.ts.lint'),
    },
    {
      code: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'bar/test.ts.lint'),
      ).toString(),
      options: [
        {
          baseUrl: 'core',
        },
      ],
      filename: Path.join(TEST_DIR_PATH, 'bar/test.ts.lint'),
    },
    {
      code: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'bar/he/c.ts.lint'),
      ).toString(),
      options: [
        {
          baseUrl: 'core',
        },
      ],
      filename: Path.join(TEST_DIR_PATH, 'bar/he/c.ts.lint'),
    },
    {
      code: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'core/test.ts.lint'),
      ).toString(),
      options: [
        {
          baseUrl: 'core',
        },
      ],
      filename: Path.join(TEST_DIR_PATH, 'core/test.ts.lint'),
    },
    {
      code: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'core/b/test.ts.lint'),
      ).toString(),
      options: [
        {
          baseUrl: 'core',
        },
      ],
      filename: Path.join(TEST_DIR_PATH, 'core/b/test.ts.lint'),
    },
    {
      code: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'core/b/c/test.ts.lint'),
      ).toString(),
      options: [
        {
          baseUrl: 'core',
        },
      ],
      filename: Path.join(TEST_DIR_PATH, 'core/b/c/test.ts.lint'),
    },
  ],
  invalid: [
    {
      code: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'test.ts.lint'),
      ).toString(),
      filename: Path.join(TEST_DIR_PATH, 'test.ts.lint'),
      options: [
        {
          baseUrl: 'core',
        },
      ],
      errors: [
        {messageId: 'canNotImportDirectoryModules', line: 1},
        {messageId: 'canNotImportDirectoryModules', line: 3},
        {messageId: 'canNotImportDirectoryModules', line: 5},
        {messageId: 'canNotImportDirectoryModules', line: 9},
      ],
    },
  ],
});
