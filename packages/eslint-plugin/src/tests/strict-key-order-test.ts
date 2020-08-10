import {rules} from '../rules';

import {
  RuleTester,
  getTestFileContent,
  getTestFileFullPath,
  getTestsDirPath,
} from './@utils';

const RULE_NAME = 'strict-key-order';

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
  valid: [],
  invalid: [
    {
      code: getTestFileContent(TEST_DIR_PATH, 'test.ts'),
      filename: getTestFileFullPath(TEST_DIR_PATH, 'test.ts'),
      errors: [
        {messageId: 'wrongPosition', line: 33, column: 3, endColumn: 15},
        {messageId: 'wrongPosition', line: 39, column: 3, endColumn: 15},
        {messageId: 'wrongPosition', line: 65, column: 3, endColumn: 4},
        {messageId: 'wrongPosition', line: 70, column: 3, endColumn: 4},
      ],
    },
  ],
});
