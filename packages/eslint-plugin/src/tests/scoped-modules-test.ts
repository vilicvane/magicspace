import FS from 'fs';
import Path from 'path';

import {rules} from '../rules';

import {RuleTester, getTestsDirPath} from './@utils';

const TEST_DIR_PATH = getTestsDirPath('scoped-modules');

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
});

ruleTester.run('scoped-modules', rules['scoped-modules'], {
  valid: [
    {
      code: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'export-as-namespace/1/index.ts'),
      ).toString(),
      filename: Path.join(TEST_DIR_PATH, 'export-as-namespace/1/index.ts'),
    },
  ],
  invalid: [
    {
      code: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'banned-exports/@test.ts.lint'),
      ).toString(),
      filename: Path.join(TEST_DIR_PATH, 'banned-exports/@test.ts.lint'),
      errors: [
        {messageId: 'bannedExport', line: 3},
        {messageId: 'bannedExport', line: 5},
      ],
      output: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'banned-exports/@test.ts.fix'),
      ).toString(),
    },
    {
      code: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'banned-exports/test.ts.lint'),
      ).toString(),
      filename: Path.join(TEST_DIR_PATH, 'banned-exports/test.ts.lint'),
      errors: [{messageId: 'bannedExport', line: 2}],
      output: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'banned-exports/test.ts.fix'),
      ).toString(),
    },
    {
      code: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'banned-exports/test2.ts.lint'),
      ).toString(),
      filename: Path.join(TEST_DIR_PATH, 'banned-exports/test2.ts.lint'),
      errors: [{messageId: 'bannedExport', line: 1}],
      output: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'banned-exports/test2.ts.fix'),
      ).toString(),
    },
    {
      code: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'banned-imports/test.ts.lint'),
      ).toString(),
      filename: Path.join(TEST_DIR_PATH, 'banned-imports/test.ts.lint'),
      errors: [
        {messageId: 'bannedImport', line: 1},
        {messageId: 'bannedImport', line: 2},
      ],
      output: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'banned-imports/test.ts.fix'),
      ).toString(),
    },
    {
      code: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'missing-all-imports/index.ts.lint'),
      ).toString(),
      filename: Path.join(TEST_DIR_PATH, 'missing-all-imports/index.ts'),
      errors: [{messageId: 'missingExports'}],
      output: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'missing-all-imports/index.ts.fix'),
      ).toString(),
    },
    {
      code: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'missing-some-imports/index.ts.lint'),
      ).toString(),
      filename: Path.join(TEST_DIR_PATH, 'missing-some-imports/index.ts'),
      errors: [{messageId: 'missingExports'}],
      output: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'missing-some-imports/index.ts.fix'),
      ).toString(),
    },
    {
      code: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'export-namespace/1/index.ts.lint'),
      ).toString(),
      filename: Path.join(TEST_DIR_PATH, 'export-namespace/1/index.ts'),
      errors: [{messageId: 'bannedImportWhenNamespaceExists'}],
      output: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'export-namespace/1/index.ts.fix'),
      ).toString(),
    },
    {
      code: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'export-namespace/1/namespace.ts'),
      ).toString(),
      filename: Path.join(TEST_DIR_PATH, 'export-namespace/1/namespace.ts'),
      errors: [{messageId: 'missingExports'}],
      output: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'export-namespace/1/namespace.ts.fix'),
      ).toString(),
    },
    {
      code: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'export-namespace/2/namespace.ts'),
      ).toString(),
      filename: Path.join(TEST_DIR_PATH, 'export-namespace/2/namespace.ts'),
      errors: [{messageId: 'bannedExport'}],
      output: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'export-namespace/2/namespace.ts.fix'),
      ).toString(),
    },
    {
      code: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'export-namespace/2/index.ts.lint'),
      ).toString(),
      filename: Path.join(TEST_DIR_PATH, 'export-namespace/2/index.ts'),
      errors: [{messageId: 'missingImports'}],
      output: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'export-namespace/2/index.ts.fix'),
      ).toString(),
    },
  ],
});
