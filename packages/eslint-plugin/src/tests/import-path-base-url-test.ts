import {rules} from '../rules';

import {
  RuleTester,
  getTestFileContent,
  getTestFileFullPath,
  getTestsDirPath,
} from './@utils';

const RULE_NAME = 'import-path-base-url';

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
      code: getTestFileContent(TEST_DIR_PATH, 'invalid/outter.ts.lint'),
      filename: getTestFileFullPath(TEST_DIR_PATH, 'invalid/outter.ts.lint'),
      errors: [{messageId: 'importMustUseBaseURL', line: 1}],
      output: getTestFileContent(TEST_DIR_PATH, 'invalid/outter.ts.fix'),
    },
    {
      code: getTestFileContent(
        TEST_DIR_PATH,
        'invalid/core/someFunc/bar.ts.lint',
      ),
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'invalid/core/someFunc/bar.ts.lint',
      ),
      errors: [
        {messageId: 'importMustBeRelativePath', line: 1},
        {messageId: 'importMustBeRelativePath', line: 2},
        {messageId: 'importMustUseBaseURL', line: 9},
      ],
      output: getTestFileContent(
        TEST_DIR_PATH,
        'invalid/core/someFunc/bar.ts.fix',
      ),
    },
  ],
});
