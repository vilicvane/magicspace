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

ruleTester.run('import-path-base-url', rules['import-path-base-url'], {
  valid: [],
  invalid: [
    {
      code: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/import-path-base-url/invalid/outter.ts.lint',
        ),
      ).toString(),
      filename: Path.join(
        __dirname,
        '../../test/import-path-base-url/invalid/outter.ts.lint',
      ),
      errors: [{messageId: 'importMustUseBaseURL', line: 1}],
      output: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/import-path-base-url/invalid/outter.ts.fix',
        ),
      ).toString(),
    },
    {
      code: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/import-path-base-url/invalid/core/someFunc/bar.ts.lint',
        ),
      ).toString(),
      filename: Path.join(
        __dirname,
        '../../test/import-path-base-url/invalid/core/someFunc/bar.ts.lint',
      ),
      errors: [
        {messageId: 'importMustBeRelativePath', line: 1},
        {messageId: 'importMustBeRelativePath', line: 2},
        {messageId: 'importMustUseBaseURL', line: 9},
      ],
      output: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/import-path-base-url/invalid/core/someFunc/bar.ts.fix',
        ),
      ).toString(),
    },
  ],
});
