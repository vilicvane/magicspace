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
    tsconfigRootDir: Path.join(__dirname, '../../test/strict-key-order/'),
  },
});

ruleTester.run('strict-key-order', rules['strict-key-order'], {
  valid: [],
  invalid: [
    {
      code: FS.readFileSync(
        Path.join(__dirname, '../../test/strict-key-order/test.ts'),
      ).toString(),
      filename: Path.join(__dirname, '../../test/strict-key-order/test.ts'),
      errors: [
        {messageId: 'strictKeyOrder', line: 34, column: 3, endColumn: 26},
        {messageId: 'strictKeyOrder', line: 40, column: 3, endColumn: 26},
      ],
    },
  ],
});
