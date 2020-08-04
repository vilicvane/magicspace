import FS from 'fs';
import Path from 'path';

import {rules} from '../rules';

import {RuleTester, getTestsDirPath} from './@utils';

const TEST_DIR_PATH = getTestsDirPath('import-path-be-smart');

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
});

ruleTester.run('import-path-be-smart', rules['import-path-be-smart'], {
  valid: [],
  invalid: [
    {
      code: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'invalid/default/foo/test.ts.lint'),
      ).toString(),
      filename: Path.join(TEST_DIR_PATH, 'invalid/default/foo/test.ts.lint'),
      errors: [
        {messageId: 'nonstandardImportPath', line: 1},
        {messageId: 'nonstandardImportPath', line: 9},
        {messageId: 'nonstandardImportPath', line: 11},
        {messageId: 'nonstandardImportPath', line: 12},
      ],
      output: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'invalid/default/foo/test.ts.fix'),
      ).toString(),
    },
    {
      code: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'invalid/node-modules/test.ts.lint'),
      ).toString(),
      filename: Path.join(TEST_DIR_PATH, 'invalid/node-modules/test.ts.lint'),
      errors: [
        {messageId: 'nonstandardImportPath', line: 1},
        {messageId: 'nonstandardImportPath', line: 2},
      ],
      output: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'invalid/node-modules/test.ts.fix'),
      ).toString(),
    },
  ],
});
