import {rules} from '../rules';

import {
  RuleTester,
  getTestFileContent,
  getTestFileFullPath,
  getTestsDirPath,
} from './@utils';

const RULE_NAME = 'no-unnecessary-type-assertion';

const TEST_DIR_PATH = getTestsDirPath(RULE_NAME);

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
});

ruleTester.run(RULE_NAME, rules[RULE_NAME], {
  valid: [],
  invalid: [
    {
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: getTestFileFullPath(
          TEST_DIR_PATH,
          'invalid/noStrictNullChecks',
        ),
      },
      code: getTestFileContent(
        TEST_DIR_PATH,
        'invalid/noStrictNullChecks/test.ts',
      ),
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'invalid/noStrictNullChecks/test.ts',
      ),
      errors: [{messageId: 'unnecessaryAssertion', line: 5}],
      output: getTestFileContent(
        TEST_DIR_PATH,
        'invalid/noStrictNullChecks/test.ts.fix',
      ),
    },
    {
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: getTestFileFullPath(TEST_DIR_PATH, 'invalid/strict'),
      },
      options: [['AnyDuringMigration']],
      code: getTestFileContent(TEST_DIR_PATH, 'invalid/strict/test.ts'),
      filename: getTestFileFullPath(TEST_DIR_PATH, 'invalid/strict/test.ts'),
      output: getTestFileContent(TEST_DIR_PATH, 'invalid/strict/test.ts.fix'),
      errors: [
        {messageId: 'unnecessaryAssertion', line: 9},
        {messageId: 'unnecessaryAssertion', line: 10},
        {messageId: 'unnecessaryAssertion', line: 12},
        {messageId: 'unnecessaryAssertion', line: 16},
        {messageId: 'unnecessaryAssertion', line: 21},
        {messageId: 'unnecessaryAssertion', line: 25},
        {messageId: 'unnecessaryAssertion', line: 26},
        {messageId: 'unnecessaryAssertion', line: 27},
        {messageId: 'unnecessaryAssertion', line: 28},
        {messageId: 'unnecessaryAssertion', line: 29},
        {messageId: 'unnecessaryAssertion', line: 30},
        {messageId: 'unnecessaryAssertion', line: 31},
        {messageId: 'unnecessaryAssertion', line: 44},
        {messageId: 'unnecessaryAssertion', line: 46},
        {messageId: 'unnecessaryAssertion', line: 66},
        {messageId: 'unnecessaryAssertion', line: 68},
        {messageId: 'unnecessaryAssertion', line: 72},
        {messageId: 'unnecessaryAssertion', line: 74},
        {messageId: 'unnecessaryAssertion', line: 96},
      ],
    },
    {
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: getTestFileFullPath(
          TEST_DIR_PATH,
          'invalid/strictNullChecks',
        ),
      },
      options: [['AnyDuringMigration']],
      code: getTestFileContent(
        TEST_DIR_PATH,
        'invalid/strictNullChecks/test.ts',
      ),
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'invalid/strictNullChecks/test.ts',
      ),
      output: getTestFileContent(
        TEST_DIR_PATH,
        'invalid/strictNullChecks/test.ts.fix',
      ),
      errors: [
        {messageId: 'unnecessaryAssertion', line: 9},
        {messageId: 'unnecessaryAssertion', line: 10},
        {messageId: 'unnecessaryAssertion', line: 12},
        {messageId: 'unnecessaryAssertion', line: 16},
        {messageId: 'unnecessaryAssertion', line: 21},
        {messageId: 'unnecessaryAssertion', line: 25},
        {messageId: 'unnecessaryAssertion', line: 26},
        {messageId: 'unnecessaryAssertion', line: 27},
        {messageId: 'unnecessaryAssertion', line: 28},
        {messageId: 'unnecessaryAssertion', line: 29},
        {messageId: 'unnecessaryAssertion', line: 30},
        {messageId: 'unnecessaryAssertion', line: 31},
        {messageId: 'unnecessaryAssertion', line: 44},
        {messageId: 'unnecessaryAssertion', line: 46},
        {messageId: 'unnecessaryAssertion', line: 66},
        {messageId: 'unnecessaryAssertion', line: 68},
        {messageId: 'unnecessaryAssertion', line: 72},
        {messageId: 'unnecessaryAssertion', line: 74},
        {messageId: 'unnecessaryAssertion', line: 96},
        {messageId: 'unnecessaryAssertion', line: 106},
      ],
    },
  ],
});
