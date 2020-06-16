import FS from 'fs';
import Path from 'path';

import {RuleTesterConfig} from '@typescript-eslint/experimental-utils/dist/ts-eslint';

import {rules} from '../rules';

import {RuleTester} from './@utils';

const ruleTester1 = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: Path.join(
      __dirname,
      '../../test/import-type-unification/',
    ),
  },
});

ruleTester1.run('import-type-unification', rules['import-type-unification'], {
  valid: [],
  invalid: [
    {
      code: FS.readFileSync(
        Path.join(__dirname, '../../test/import-type-unification/test1.ts'),
      ).toString(),
      filename: Path.join(
        __dirname,
        '../../test/import-type-unification/test1.ts',
      ),
      errors: [
        {messageId: 'importTypeNotUnified', line: 1},
        {messageId: 'importTypeNotUnified', line: 2},
      ],
    },
    {
      code: FS.readFileSync(
        Path.join(__dirname, '../../test/import-type-unification/test2.ts'),
      ).toString(),
      filename: Path.join(
        __dirname,
        '../../test/import-type-unification/test2.ts',
      ),
      errors: [
        {messageId: 'importTypeNotUnified', line: 5},
        {messageId: 'importTypeNotUnified', line: 6},
      ],
    },
    {
      code: FS.readFileSync(
        Path.join(__dirname, '../../test/import-type-unification/test3.ts'),
      ).toString(),
      filename: Path.join(
        __dirname,
        '../../test/import-type-unification/test3.ts',
      ),
      options: [
        {
          except: [
            {
              module: 'http',
              allow: [
                {
                  type: 'default',
                  identifiers: '*',
                },
                'equals',
                {
                  type: 'namespace',
                  identifiers: ['http', 'httpp', 'htttp'],
                },
              ],
            },
            {
              module: 'https',
              allow: [{type: 'named', identifiers: 'identical'}],
            },
          ],
        },
      ],
      errors: [
        {messageId: 'importTypeNotUnified', line: 1},
        {messageId: 'importTypeNotUnified', line: 6},
        {messageId: 'importTypeNotUnified', line: 7},
        {messageId: 'importTypeNotUnified', line: 8},
        {messageId: 'importTypeNotUnified', line: 10, column: 9},
        {messageId: 'importTypeNotUnified', line: 10, column: 12},
        {messageId: 'importTypeNotUnified', line: 10, column: 15},
      ],
    },
  ],
});

const ruleTester2 = new RuleTester({
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
} as RuleTesterConfig);

ruleTester2.run(
  'import-type-unification with js parser',
  rules['import-type-unification'],
  {
    valid: [
      {
        code: FS.readFileSync(
          Path.join(__dirname, '../../test/import-type-unification/test2.js'),
        ).toString(),
        filename: Path.join(
          __dirname,
          '../../test/import-type-unification/test2.js',
        ),
        options: [
          {
            except: [
              {
                module: 'fs',
                allow: ['default', 'namespace'],
              },
            ],
          },
        ],
      },
    ],
    invalid: [
      {
        code: FS.readFileSync(
          Path.join(__dirname, '../../test/import-type-unification/test1.js'),
        ).toString(),
        filename: Path.join(
          __dirname,
          '../../test/import-type-unification/test1.js',
        ),
        errors: [
          {messageId: 'importTypeNotUnified', line: 1},
          {messageId: 'importTypeNotUnified', line: 2},
        ],
      },
      {
        code: FS.readFileSync(
          Path.join(__dirname, '../../test/import-type-unification/test3.js'),
        ).toString(),
        filename: Path.join(
          __dirname,
          '../../test/import-type-unification/test3.js',
        ),
        options: [
          {
            except: [
              {
                module: './foo',
                allow: ['namespace'],
              },
            ],
          },
        ],
        errors: [{messageId: 'importTypeNotUnified', line: 2}],
      },
    ],
  },
);
