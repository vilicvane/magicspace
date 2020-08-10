import {rules} from '../rules';

import {
  RuleTester,
  getTestFileContent,
  getTestFileFullPath,
  getTestsDirPath,
} from './@utils';

const RULE_NAME = 'explicit-return-type';

const TEST_DIR_PATH = getTestsDirPath(RULE_NAME);

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: TEST_DIR_PATH,
  },
});

ruleTester.run(RULE_NAME, rules[RULE_NAME], {
  valid: [
    {
      code: getTestFileContent(TEST_DIR_PATH, 'test.tsx'),
      filename: getTestFileFullPath(TEST_DIR_PATH, 'test.tsx'),
    },
  ],
  invalid: [
    {
      code: getTestFileContent(TEST_DIR_PATH, 'test.ts'),
      filename: getTestFileFullPath(TEST_DIR_PATH, 'test.ts'),
      errors: [
        {messageId: 'explicitReturnTypeRequired', line: 1},
        {messageId: 'explicitReturnTypeRequired', line: 2, column: 11},
        {messageId: 'explicitReturnTypeRequired', line: 4, column: 3},
        {messageId: 'explicitReturnTypeRequired', line: 8, column: 3},
        {
          messageId: 'explicitReturnTypeRequired',
          line: 11,
          column: 3,
          endLine: 13,
          endColumn: 4,
        },
        {messageId: 'explicitReturnTypeRequired', line: 29, column: 3},
        {messageId: 'explicitReturnTypeRequired', line: 30, column: 8},
        {messageId: 'explicitReturnTypeRequired', line: 31, column: 8},
        {messageId: 'explicitReturnTypeRequired', line: 40, column: 11},
        {messageId: 'explicitReturnTypeRequired', line: 60},
        {messageId: 'explicitReturnTypeRequired', line: 62, endLine: 64},
        {messageId: 'explicitReturnTypeRequired', line: 66, endLine: 68},
        {messageId: 'explicitReturnTypeRequired', line: 70, endLine: 72},
      ],
      output: getTestFileContent(TEST_DIR_PATH, 'test.ts.fix'),
    },
  ],
});
