import FS from 'fs';
import Path from 'path';

import {rules} from '../rules';

import {RuleTester} from './@utils';

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: Path.join(__dirname, '../../test/ordered-imports/'),
  },
});

ruleTester.run('ordered-imports', rules['ordered-imports'], {
  valid: [],
  invalid: [
    {
      code: FS.readFileSync(
        Path.join(__dirname, '../../test/ordered-imports/test.ts'),
      ).toString(),
      filename: Path.join(__dirname, '../../test/ordered-imports/test.ts'),
      errors: [{messageId: 'importSourcesUnordered', line: 2}],
      output: FS.readFileSync(
        Path.join(__dirname, '../../test/ordered-imports/test.ts.fix'),
      ).toString(),
    },
    {
      code: FS.readFileSync(
        Path.join(__dirname, '../../test/ordered-imports/case-insensitive.ts'),
      ).toString(),
      filename: Path.join(
        __dirname,
        '../../test/ordered-imports/case-insensitive.ts',
      ),
      errors: [
        {messageId: 'namedImportsUnordered', line: 3},
        {
          messageId: 'importSourcesUnordered',
          line: 7,
          column: 1,
          endLine: 7,
          endColumn: 30,
        },
        {
          messageId: 'namedImportsUnordered',
          line: 7,
          column: 9,
          endLine: 7,
          endColumn: 14,
        },
        {
          messageId: 'namedImportsUnordered',
          line: 10,
          column: 12,
          endLine: 10,
          endColumn: 17,
        },
        {
          messageId: 'namedImportsUnordered',
          line: 14,
          column: 5,
          endLine: 15,
          endColumn: 11,
        },
        {messageId: 'importSourcesUnordered', line: 17},
        {
          messageId: 'importSourcesUnordered',
          line: 25,
          column: 1,
          endLine: 25,
          endColumn: 28,
        },
        {
          messageId: 'importSourcesUnordered',
          line: 41,
          column: 1,
          endLine: 41,
          endColumn: 34,
        },
        {
          messageId: 'importSourcesUnordered',
          line: 45,
          column: 30,
          endLine: 45,
          endColumn: 57,
        },
        {
          messageId: 'importSourcesUnordered',
          line: 48,
          column: 1,
          endLine: 48,
          endColumn: 28,
        },
      ],
      output: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/ordered-imports/case-insensitive.ts.fix',
        ),
      ).toString(),
    },
  ],
});
