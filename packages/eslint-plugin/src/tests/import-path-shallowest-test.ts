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

ruleTester.run('import-path-shallowest', rules['import-path-shallowest'], {
  valid: [
    {
      code: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/import-path-shallowest/foo/test.ts.lint',
        ),
      ).toString(),
      options: [
        {
          baseUrl: 'core',
        },
      ],
      filename: Path.join(
        __dirname,
        '../../test/import-path-shallowest/foo/test.ts.lint',
      ),
    },
    {
      code: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/import-path-shallowest/bar/test.ts.lint',
        ),
      ).toString(),
      options: [
        {
          baseUrl: 'core',
        },
      ],
      filename: Path.join(
        __dirname,
        '../../test/import-path-shallowest/bar/test.ts.lint',
      ),
    },
    {
      code: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/import-path-shallowest/bar/he/c.ts.lint',
        ),
      ).toString(),
      options: [
        {
          baseUrl: 'core',
        },
      ],
      filename: Path.join(
        __dirname,
        '../../test/import-path-shallowest/bar/he/c.ts.lint',
      ),
    },
    {
      code: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/import-path-shallowest/core/test.ts.lint',
        ),
      ).toString(),
      options: [
        {
          baseUrl: 'core',
        },
      ],
      filename: Path.join(
        __dirname,
        '../../test/import-path-shallowest/core/test.ts.lint',
      ),
    },
    {
      code: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/import-path-shallowest/core/b/test.ts.lint',
        ),
      ).toString(),
      options: [
        {
          baseUrl: 'core',
        },
      ],
      filename: Path.join(
        __dirname,
        '../../test/import-path-shallowest/core/b/test.ts.lint',
      ),
    },
    {
      code: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/import-path-shallowest/core/b/c/test.ts.lint',
        ),
      ).toString(),
      options: [
        {
          baseUrl: 'core',
        },
      ],
      filename: Path.join(
        __dirname,
        '../../test/import-path-shallowest/core/b/c/test.ts.lint',
      ),
    },
  ],
  invalid: [
    {
      code: FS.readFileSync(
        Path.join(__dirname, '../../test/import-path-shallowest/test.ts.lint'),
      ).toString(),
      filename: Path.join(
        __dirname,
        '../../test/import-path-shallowest/test.ts.lint',
      ),
      options: [
        {
          baseUrl: 'core',
        },
      ],
      errors: [
        {messageId: 'canNotImportDirectoryModules', line: 1},
        {messageId: 'canNotImportDirectoryModules', line: 3},
        {messageId: 'canNotImportDirectoryModules', line: 5},
        {messageId: 'canNotImportDirectoryModules', line: 9},
      ],
    },
  ],
});
