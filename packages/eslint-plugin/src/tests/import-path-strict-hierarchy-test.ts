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

ruleTester.run(
  'import-path-strict-hierarchy',
  rules['import-path-strict-hierarchy'],
  {
    valid: [
      {
        code: FS.readFileSync(
          Path.join(
            __dirname,
            '../../test/import-path-strict-hierarchy/src/index.ts.lint',
          ),
        ).toString(),
        filename: Path.join(
          __dirname,
          '../../test/import-path-strict-hierarchy/src/index.ts.lint',
        ),
        options: [
          {
            hierarchy: {
              core: [],
              utils: [],
              services: ['core', 'utils'],
              'service-entrances': ['services', 'core', 'utils'],
              main: ['service-entrances', 'services', 'core', 'utils'],
            },
            baseUrl: 'src',
          },
        ],
      },
    ],
    invalid: [
      {
        code: FS.readFileSync(
          Path.join(
            __dirname,
            '../../test/import-path-strict-hierarchy/src/main.ts.lint',
          ),
        ).toString(),
        filename: Path.join(
          __dirname,
          '../../test/import-path-strict-hierarchy/src/main.ts',
        ),
        options: [
          {
            hierarchy: {
              core: [],
              utils: [],
              services: ['core', 'utils'],
              'service-entrances': ['services', 'core', 'utils'],
              main: ['service-entrances', 'services', 'core', 'utils'],
            },
            baseUrl: 'src',
          },
        ],
        errors: [
          {messageId: 'bannedHierarchyImport', line: 5},
          {messageId: 'bannedHierarchyImport', line: 9},
          {messageId: 'bannedHierarchyImport', line: 11},
        ],
      },
      {
        code: FS.readFileSync(
          Path.join(
            __dirname,
            '../../test/import-path-strict-hierarchy/src/core/core-sub/index.ts.lint',
          ),
        ).toString(),
        options: [
          {
            hierarchy: {
              core: [],
              utils: [],
              services: ['core', 'utils'],
              'service-entrances': ['services', 'core', 'utils'],
              main: ['service-entrances', 'services', 'core', 'utils'],
            },
            baseUrl: 'src',
          },
        ],
        filename: Path.join(
          __dirname,
          '../../test/import-path-strict-hierarchy/src/core/core-sub/index.ts.lint',
        ),
        errors: [
          {messageId: 'bannedHierarchyImport', line: 3},
          {messageId: 'bannedHierarchyImport', line: 4},
        ],
      },
      {
        code: FS.readFileSync(
          Path.join(
            __dirname,
            '../../test/import-path-strict-hierarchy/src/core/index.ts.lint',
          ),
        ).toString(),
        options: [
          {
            hierarchy: {
              core: [],
              utils: [],
              services: ['core', 'utils'],
              'service-entrances': ['services', 'core', 'utils'],
              main: ['service-entrances', 'services', 'core', 'utils'],
            },
            baseUrl: 'src',
          },
        ],
        filename: Path.join(
          __dirname,
          '../../test/import-path-strict-hierarchy/src/core/index.ts.lint',
        ),
        errors: [
          {messageId: 'bannedHierarchyImport', line: 2},
          {messageId: 'bannedHierarchyImport', line: 3},
          {messageId: 'bannedHierarchyImport', line: 6},
          {messageId: 'bannedHierarchyImport', line: 8},
        ],
      },
      {
        code: FS.readFileSync(
          Path.join(
            __dirname,
            '../../test/import-path-strict-hierarchy/src/main/index.ts.lint',
          ),
        ).toString(),
        options: [
          {
            hierarchy: {
              core: [],
              utils: [],
              services: ['core', 'utils'],
              'service-entrances': ['services', 'core', 'utils'],
              main: ['service-entrances', 'services', 'core', 'utils'],
            },
            baseUrl: 'src',
          },
        ],
        filename: Path.join(
          __dirname,
          '../../test/import-path-strict-hierarchy/src/main/index.ts.lint',
        ),
        errors: [{messageId: 'bannedHierarchyImport', line: 4}],
      },
      {
        code: FS.readFileSync(
          Path.join(
            __dirname,
            '../../test/import-path-strict-hierarchy/src/services/services-sub/index.ts.lint',
          ),
        ).toString(),
        options: [
          {
            hierarchy: {
              core: [],
              utils: [],
              services: ['core', 'utils'],
              'service-entrances': ['services', 'core', 'utils'],
              main: ['service-entrances', 'services', 'core', 'utils'],
            },
            baseUrl: 'src',
          },
        ],
        filename: Path.join(
          __dirname,
          '../../test/import-path-strict-hierarchy/src/services/services-sub/index.ts.lint',
        ),
        errors: [{messageId: 'bannedHierarchyImport', line: 5}],
      },
      {
        code: FS.readFileSync(
          Path.join(
            __dirname,
            '../../test/import-path-strict-hierarchy/src/services/index.ts.lint',
          ),
        ).toString(),
        options: [
          {
            hierarchy: {
              core: [],
              utils: [],
              services: ['core', 'utils'],
              'service-entrances': ['services', 'core', 'utils'],
              main: ['service-entrances', 'services', 'core', 'utils'],
            },
            baseUrl: 'src',
          },
        ],
        filename: Path.join(
          __dirname,
          '../../test/import-path-strict-hierarchy/src/services/index.ts.lint',
        ),
        errors: [{messageId: 'bannedHierarchyImport', line: 3}],
      },
    ],
  },
);
