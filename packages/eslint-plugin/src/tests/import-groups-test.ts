import {rules} from '../rules';

import {
  RuleTester,
  getTestFileContent,
  getTestFileFullPath,
  getTestsDirPath,
} from './@utils';

const RULE_NAME = 'import-groups';

const TEST_DIR_PATH = getTestsDirPath(RULE_NAME);

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
});

ruleTester.run(RULE_NAME, rules[RULE_NAME], {
  valid: [
    {
      code: getTestFileContent(TEST_DIR_PATH, 'valid/base/test.ts.lint'),
      filename: getTestFileFullPath(TEST_DIR_PATH, 'valid/base/test.ts.lint'),
    },
  ],
  invalid: [
    {
      code: getTestFileContent(
        TEST_DIR_PATH,
        'invalid/side-effect/test.ts.lint',
      ),
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'invalid/side-effect/test.ts.lint',
      ),
      errors: [{messageId: 'expectingEmptyLine'}],
      output: getTestFileContent(
        TEST_DIR_PATH,
        'invalid/side-effect/test.ts.fix',
      ),
    },
    {
      code: getTestFileContent(
        TEST_DIR_PATH,
        'invalid/default/group-1.ts.lint',
      ),
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'invalid/default/group-1.ts.lint',
      ),
      errors: [
        {messageId: 'unexpectedEmptyLine', line: 4},
        {messageId: 'unexpectedCodeBetweenImports', line: 6},
        {messageId: 'expectingEmptyLine', line: 10},
        {messageId: 'notGrouped', line: 12},
      ],
    },
    {
      code: getTestFileContent(
        TEST_DIR_PATH,
        'invalid/default/group-2.ts.lint',
      ),
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'invalid/default/group-2.ts.lint',
      ),
      errors: [
        {messageId: 'expectingEmptyLine', line: 5},
        {messageId: 'unexpectedEmptyLine', line: 10},
      ],
      output: getTestFileContent(
        TEST_DIR_PATH,
        'invalid/default/group-2.ts.fix',
      ),
    },
    {
      code: getTestFileContent(
        TEST_DIR_PATH,
        'invalid/default/leading-comments.ts.lint',
      ),
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'invalid/default/leading-comments.ts.lint',
      ),
      errors: [
        {messageId: 'unexpectedEmptyLine', line: 6},
        {messageId: 'unexpectedEmptyLine', line: 11},
      ],
      output: getTestFileContent(
        TEST_DIR_PATH,
        'invalid/default/leading-comments.ts.fix',
      ),
    },
    {
      code: getTestFileContent(
        TEST_DIR_PATH,
        'invalid/default/sort-imports.ts.lint',
      ),
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'invalid/default/sort-imports.ts.lint',
      ),
      errors: [
        {messageId: 'expectingEmptyLine', line: 2},
        {messageId: 'notGrouped', line: 3},
        {messageId: 'notGrouped', line: 4},
      ],
      output: getTestFileContent(
        TEST_DIR_PATH,
        'invalid/default/sort-imports.ts.fix',
      ),
    },
  ],
});
