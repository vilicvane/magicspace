import FS from 'fs';
import Path from 'path';

import {rules} from '../rules';

import {RuleTester} from './@utils';

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
});

ruleTester.run('import-groups', rules['import-groups'], {
  valid: [
    {
      code: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/import-groups/valid/base/test.ts.lint',
        ),
      ).toString(),
      filename: Path.join(
        __dirname,
        '../../test/import-groups/valid/base/test.ts.lint',
      ),
    },
  ],
  invalid: [
    {
      code: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/import-groups/invalid/side-effect/test.ts.lint',
        ),
      ).toString(),
      filename: Path.join(
        __dirname,
        '../../test/import-groups/invalid/side-effect/test.ts.lint',
      ),
      errors: [{messageId: 'expectingEmptyLine'}],
      output: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/import-groups/invalid/side-effect/test.ts.fix',
        ),
      ).toString(),
    },
    {
      code: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/import-groups/invalid/default/group-1.ts.lint',
        ),
      ).toString(),
      filename: Path.join(
        __dirname,
        '../../test/import-groups/invalid/default/group-1.ts.lint',
      ),
      errors: [
        {messageId: 'unexpectedEmptyLine', line: 4},
        {messageId: 'unexpectedCodeBetweenImports', line: 6},
        {messageId: 'expectingEmptyLine', line: 10},
        {messageId: 'notGrouped', line: 12},
      ],
    },
    {
      code: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/import-groups/invalid/default/group-2.ts.lint',
        ),
      ).toString(),
      filename: Path.join(
        __dirname,
        '../../test/import-groups/invalid/default/group-2.ts.lint',
      ),
      errors: [
        {messageId: 'expectingEmptyLine', line: 5},
        {messageId: 'unexpectedEmptyLine', line: 10},
      ],
      output: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/import-groups/invalid/default/group-2.ts.fix',
        ),
      ).toString(),
    },
    {
      code: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/import-groups/invalid/default/leading-comments.ts.lint',
        ),
      ).toString(),
      filename: Path.join(
        __dirname,
        '../../test/import-groups/invalid/default/leading-comments.ts.lint',
      ),
      errors: [
        {messageId: 'unexpectedEmptyLine', line: 6},
        {messageId: 'unexpectedEmptyLine', line: 11},
      ],
      output: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/import-groups/invalid/default/leading-comments.ts.fix',
        ),
      ).toString(),
    },
    {
      code: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/import-groups/invalid/default/sort-imports.ts.lint',
        ),
      ).toString(),
      filename: Path.join(
        __dirname,
        '../../test/import-groups/invalid/default/sort-imports.ts.lint',
      ),
      errors: [
        {messageId: 'expectingEmptyLine', line: 2},
        {messageId: 'notGrouped', line: 3},
        {messageId: 'notGrouped', line: 4},
      ],
      output: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/import-groups/invalid/default/sort-imports.ts.fix',
        ),
      ).toString(),
    },
  ],
});
