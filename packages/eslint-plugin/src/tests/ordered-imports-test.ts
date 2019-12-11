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
  ],
});
