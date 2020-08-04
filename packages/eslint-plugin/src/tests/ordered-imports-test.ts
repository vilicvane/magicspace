import FS from 'fs';
import Path from 'path';

import {rules} from '../rules';

import {RuleTester, getTestsDirPath} from './@utils';

const TEST_DIR_PATH = getTestsDirPath('ordered-imports');

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: TEST_DIR_PATH,
  },
});

ruleTester.run('ordered-imports', rules['ordered-imports'], {
  valid: [],
  invalid: [
    {
      code: FS.readFileSync(Path.join(TEST_DIR_PATH, 'test.ts')).toString(),
      filename: Path.join(TEST_DIR_PATH, 'test.ts'),
      errors: [{messageId: 'importSourcesUnordered', line: 2}],
      output: FS.readFileSync(
        Path.join(TEST_DIR_PATH, 'test.ts.fix'),
      ).toString(),
    },
  ],
});
