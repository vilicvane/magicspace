import {rules} from '../rules';

import {
  RuleTester,
  getTestFileContent,
  getTestFileFullPath,
  getTestsDirPath,
} from './@utils';

const RULE_NAME = 'ordered-imports';

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
      errors: [{messageId: 'importSourcesUnordered', line: 2}],
      output: getTestFileContent(TEST_DIR_PATH, 'test.ts.fix'),
    },
  ],
});
