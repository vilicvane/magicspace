import FS from 'fs';
import * as Path from 'path';

import {rules} from '../rules';

import {RuleTester} from './@utils';

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
});

ruleTester.run(
  'no-unnecessary-type-assertion',
  rules['no-unnecessary-type-assertion'],
  {
    valid: [],
    invalid: [
      {
        parserOptions: {
          ecmaVersion: 2018,
          sourceType: 'module',
          project: './tsconfig.json',
          tsconfigRootDir: Path.join(
            __dirname,
            '../../test/no-unnecessary-type-assertion/invalid/noStrictNullChecks',
          ),
        },
        code: FS.readFileSync(
          Path.join(
            __dirname,
            '../../test/no-unnecessary-type-assertion/invalid/noStrictNullChecks/test.ts',
          ),
        ).toString(),
        filename: Path.join(
          __dirname,
          '../../test/no-unnecessary-type-assertion/invalid/noStrictNullChecks/test.ts',
        ),
        errors: [{messageId: 'unnecessaryAssertion', line: 5}],
        output: FS.readFileSync(
          Path.join(
            __dirname,
            '../../test/no-unnecessary-type-assertion/invalid/noStrictNullChecks/test.ts.fix',
          ),
        ).toString(),
      },
      {
        parserOptions: {
          ecmaVersion: 2018,
          sourceType: 'module',
          project: './tsconfig.json',
          tsconfigRootDir: Path.join(
            __dirname,
            '../../test/no-unnecessary-type-assertion/invalid/strict',
          ),
        },
        options: [['AnyDuringMigration']],
        code: FS.readFileSync(
          Path.join(
            __dirname,
            '../../test/no-unnecessary-type-assertion/invalid/strict/test.ts',
          ),
        ).toString(),
        filename: Path.join(
          __dirname,
          '../../test/no-unnecessary-type-assertion/invalid/strict/test.ts',
        ),
        output: FS.readFileSync(
          Path.join(
            __dirname,
            '../../test/no-unnecessary-type-assertion/invalid/strict/test.ts.fix',
          ),
        ).toString(),
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
          tsconfigRootDir: Path.join(
            __dirname,
            '../../test/no-unnecessary-type-assertion/invalid/strictNullChecks',
          ),
        },
        options: [['AnyDuringMigration']],
        code: FS.readFileSync(
          Path.join(
            __dirname,
            '../../test/no-unnecessary-type-assertion/invalid/strictNullChecks/test.ts',
          ),
        ).toString(),
        filename: Path.join(
          __dirname,
          '../../test/no-unnecessary-type-assertion/invalid/strictNullChecks/test.ts',
        ),
        output: FS.readFileSync(
          Path.join(
            __dirname,
            '../../test/no-unnecessary-type-assertion/invalid/strictNullChecks/test.ts.fix',
          ),
        ).toString(),
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
    ],
  },
);
