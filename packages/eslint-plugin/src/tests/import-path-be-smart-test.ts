import {rules} from '../rules';

import {
  RuleTester,
  getTestFileContent,
  getTestFileFullPath,
  getTestsDirPath,
} from './@utils';

const RULE_NAME = 'import-path-be-smart';

const TEST_DIR_PATH = getTestsDirPath(RULE_NAME);

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
});

ruleTester.run(RULE_NAME, rules[RULE_NAME], {
  valid: [],
  invalid: [
    {
      code: getTestFileContent(
        TEST_DIR_PATH,
        'invalid/default/foo/test.ts.lint',
      ),
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'invalid/default/foo/test.ts.lint',
      ),
      errors: [
        {messageId: 'nonstandardImportPath', line: 1},
        {messageId: 'nonstandardImportPath', line: 9},
        {messageId: 'nonstandardImportPath', line: 11},
        {messageId: 'nonstandardImportPath', line: 12},
      ],
      output: getTestFileContent(
        TEST_DIR_PATH,
        'invalid/default/foo/test.ts.fix',
      ),
    },
    {
      code: getTestFileContent(
        TEST_DIR_PATH,
        'invalid/node-modules/test.ts.lint',
      ),
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'invalid/node-modules/test.ts.lint',
      ),
      errors: [
        {messageId: 'nonstandardImportPath', line: 1},
        {messageId: 'nonstandardImportPath', line: 2},
      ],
      output: getTestFileContent(
        TEST_DIR_PATH,
        'invalid/node-modules/test.ts.fix',
      ),
    },
  ],
});
