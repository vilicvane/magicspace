import {rules} from '../rules';

import {
  RuleTester,
  getTestFileContent,
  getTestFileFullPath,
  getTestsDirPath,
} from './@utils';

const RULE_NAME = 'scoped-modules';

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
      code: getTestFileContent(TEST_DIR_PATH, 'export-as-namespace/1/index.ts'),
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'export-as-namespace/1/index.ts',
      ),
    },
  ],
  invalid: [
    {
      code: getTestFileContent(TEST_DIR_PATH, 'banned-exports/@test.ts.lint'),
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'banned-exports/@test.ts.lint',
      ),
      errors: [
        {messageId: 'bannedExport', line: 3},
        {messageId: 'bannedExport', line: 5},
      ],
      output: getTestFileContent(TEST_DIR_PATH, 'banned-exports/@test.ts.fix'),
    },
    {
      code: getTestFileContent(TEST_DIR_PATH, 'banned-exports/test.ts.lint'),
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'banned-exports/test.ts.lint',
      ),
      errors: [{messageId: 'bannedExport', line: 2}],
      output: getTestFileContent(TEST_DIR_PATH, 'banned-exports/test.ts.fix'),
    },
    {
      code: getTestFileContent(TEST_DIR_PATH, 'banned-exports/test2.ts.lint'),
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'banned-exports/test2.ts.lint',
      ),
      errors: [{messageId: 'bannedExport', line: 1}],
      output: getTestFileContent(TEST_DIR_PATH, 'banned-exports/test2.ts.fix'),
    },
    {
      code: getTestFileContent(TEST_DIR_PATH, 'banned-imports/test.ts.lint'),
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'banned-imports/test.ts.lint',
      ),
      errors: [
        {messageId: 'bannedImport', line: 1},
        {messageId: 'bannedImport', line: 2},
      ],
      output: getTestFileContent(TEST_DIR_PATH, 'banned-imports/test.ts.fix'),
    },
    {
      code: getTestFileContent(
        TEST_DIR_PATH,
        'missing-all-imports/index.ts.lint',
      ),
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'missing-all-imports/index.ts',
      ),
      errors: [{messageId: 'missingExports'}],
      output: getTestFileContent(
        TEST_DIR_PATH,
        'missing-all-imports/index.ts.fix',
      ),
    },
    {
      code: getTestFileContent(
        TEST_DIR_PATH,
        'missing-some-imports/index.ts.lint',
      ),
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'missing-some-imports/index.ts',
      ),
      errors: [{messageId: 'missingExports'}],
      output: getTestFileContent(
        TEST_DIR_PATH,
        'missing-some-imports/index.ts.fix',
      ),
    },
    {
      code: getTestFileContent(
        TEST_DIR_PATH,
        'export-namespace/1/index.ts.lint',
      ),
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'export-namespace/1/index.ts',
      ),
      errors: [{messageId: 'bannedImportWhenNamespaceExists'}],
      output: getTestFileContent(
        TEST_DIR_PATH,
        'export-namespace/1/index.ts.fix',
      ),
    },
    {
      code: getTestFileContent(
        TEST_DIR_PATH,
        'export-namespace/1/namespace.ts',
      ),
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'export-namespace/1/namespace.ts',
      ),
      errors: [{messageId: 'missingExports'}],
      output: getTestFileContent(
        TEST_DIR_PATH,
        'export-namespace/1/namespace.ts.fix',
      ),
    },
    {
      code: getTestFileContent(
        TEST_DIR_PATH,
        'export-namespace/2/namespace.ts',
      ),
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'export-namespace/2/namespace.ts',
      ),
      errors: [{messageId: 'bannedExport'}],
      output: getTestFileContent(
        TEST_DIR_PATH,
        'export-namespace/2/namespace.ts.fix',
      ),
    },
    {
      code: getTestFileContent(
        TEST_DIR_PATH,
        'export-namespace/2/index.ts.lint',
      ),
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'export-namespace/2/index.ts',
      ),
      errors: [{messageId: 'missingImports'}],
      output: getTestFileContent(
        TEST_DIR_PATH,
        'export-namespace/2/index.ts.fix',
      ),
    },
  ],
});
