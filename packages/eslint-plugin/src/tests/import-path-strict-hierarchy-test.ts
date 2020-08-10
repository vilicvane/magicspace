import {rules} from '../rules';

import {
  RuleTester,
  getTestFileContent,
  getTestFileFullPath,
  getTestsDirPath,
} from './@utils';

const RULE_NAME = 'import-path-strict-hierarchy';

const TEST_DIR_PATH = getTestsDirPath(RULE_NAME);

const ruleTester = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
});

ruleTester.run(RULE_NAME, rules[RULE_NAME], {
  valid: [
    {
      code: getTestFileContent(TEST_DIR_PATH, 'src/index.ts.lint'),
      filename: getTestFileFullPath(TEST_DIR_PATH, 'src/index.ts.lint'),
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
      code: getTestFileContent(TEST_DIR_PATH, 'src/main.ts.lint'),
      filename: getTestFileFullPath(TEST_DIR_PATH, 'src/main.ts'),
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
      code: getTestFileContent(
        TEST_DIR_PATH,
        'src/core/core-sub/index.ts.lint',
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
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'src/core/core-sub/index.ts.lint',
      ),
      errors: [
        {messageId: 'bannedHierarchyImport', line: 3},
        {messageId: 'bannedHierarchyImport', line: 4},
      ],
    },
    {
      code: getTestFileContent(TEST_DIR_PATH, 'src/core/index.ts.lint'),
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
      filename: getTestFileFullPath(TEST_DIR_PATH, 'src/core/index.ts.lint'),
      errors: [
        {messageId: 'bannedHierarchyImport', line: 2},
        {messageId: 'bannedHierarchyImport', line: 3},
        {messageId: 'bannedHierarchyImport', line: 6},
        {messageId: 'bannedHierarchyImport', line: 8},
      ],
    },
    {
      code: getTestFileContent(TEST_DIR_PATH, 'src/main/index.ts.lint'),
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
      filename: getTestFileFullPath(TEST_DIR_PATH, 'src/main/index.ts.lint'),
      errors: [{messageId: 'bannedHierarchyImport', line: 4}],
    },
    {
      code: getTestFileContent(
        TEST_DIR_PATH,
        'src/services/services-sub/index.ts.lint',
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
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'src/services/services-sub/index.ts.lint',
      ),
      errors: [{messageId: 'bannedHierarchyImport', line: 5}],
    },
    {
      code: getTestFileContent(TEST_DIR_PATH, 'src/services/index.ts.lint'),
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
      filename: getTestFileFullPath(
        TEST_DIR_PATH,
        'src/services/index.ts.lint',
      ),
      errors: [{messageId: 'bannedHierarchyImport', line: 3}],
    },
  ],
});
