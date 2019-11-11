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

ruleTester.run('scoped-modules', rules['scoped-modules'], {
  valid: [],
  invalid: [
    {
      code: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/scoped-modules/banned-exports/@test.ts.lint',
        ),
      ).toString(),
      filename: Path.join(
        __dirname,
        '../../test/scoped-modules/banned-exports/@test.ts.lint',
      ),
      errors: [
        {messageId: 'bannedExport', line: 3},
        {messageId: 'bannedExport', line: 5},
      ],
      output: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/scoped-modules/banned-exports/@test.ts.fix',
        ),
      ).toString(),
    },
    {
      code: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/scoped-modules/banned-exports/test.ts.lint',
        ),
      ).toString(),
      filename: Path.join(
        __dirname,
        '../../test/scoped-modules/banned-exports/test.ts.lint',
      ),
      errors: [{messageId: 'bannedExport', line: 2}],
      output: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/scoped-modules/banned-exports/test.ts.fix',
        ),
      ).toString(),
    },
    {
      code: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/scoped-modules/banned-exports/test2.ts.lint',
        ),
      ).toString(),
      filename: Path.join(
        __dirname,
        '../../test/scoped-modules/banned-exports/test2.ts.lint',
      ),
      errors: [{messageId: 'bannedExport', line: 1}],
      output: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/scoped-modules/banned-exports/test2.ts.fix',
        ),
      ).toString(),
    },

    {
      code: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/scoped-modules/banned-imports/test.ts.lint',
        ),
      ).toString(),
      filename: Path.join(
        __dirname,
        '../../test/scoped-modules/banned-imports/test.ts.lint',
      ),
      errors: [
        {messageId: 'bannedImport', line: 1},
        {messageId: 'bannedImport', line: 2},
      ],
      output: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/scoped-modules/banned-imports/test.ts.fix',
        ),
      ).toString(),
    },

    {
      code: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/scoped-modules/missing-all-imports/index.ts.lint',
        ),
      ).toString(),
      filename: Path.join(
        __dirname,
        '../../test/scoped-modules/missing-all-imports/index.ts',
      ),
      errors: [{messageId: 'missingExports'}],
      output: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/scoped-modules/missing-all-imports/index.ts.fix',
        ),
      ).toString(),
    },
    {
      code: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/scoped-modules/missing-some-imports/index.ts.lint',
        ),
      ).toString(),
      filename: Path.join(
        __dirname,
        '../../test/scoped-modules/missing-some-imports/index.ts',
      ),
      errors: [{messageId: 'missingExports'}],
      output: FS.readFileSync(
        Path.join(
          __dirname,
          '../../test/scoped-modules/missing-some-imports/index.ts.fix',
        ),
      ).toString(),
    },
    // {
    //   code: FS.readFileSync(
    //     Path.join(
    //       __dirname,
    //       '../../test/scoped-modules/export-namespace/index.ts.lint',
    //     ),
    //   ).toString(),
    //   filename: Path.join(
    //     __dirname,
    //     '../../test/scoped-modules/export-namespace/index.ts',
    //   ),
    //   errors: [{messageId: 'bannedImportWhenNamespaceExists'}],
    //   output: FS.readFileSync(
    //     Path.join(
    //       __dirname,
    //       '../../test/scoped-modules/export-namespace/index.ts.fix',
    //     ),
    //   ).toString(),
    // },
    // {
    //   code: FS.readFileSync(
    //     Path.join(
    //       __dirname,
    //       '../../test/scoped-modules/export-namespace/namespace.ts',
    //     ),
    //   ).toString(),
    //   filename: Path.join(
    //     __dirname,
    //     '../../test/scoped-modules/export-namespace/namespace.ts',
    //   ),
    //   errors: [{messageId: 'missingExports'}, {messageId: 'bannedExport'}],
    //   output: FS.readFileSync(
    //     Path.join(
    //       __dirname,
    //       '../../test/scoped-modules/export-namespace/namespace.ts.fix',
    //     ),
    //   ).toString(),
    // },
  ],
});
