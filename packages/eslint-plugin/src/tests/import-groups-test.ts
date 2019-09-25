import { RuleTester } from "./@utils/RuleTester";
import rule from "../rules/import-groups";

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  }
});

ruleTester.run("import-groups", rule, {
  valid: [
    //     {
    //       code: `
    // import * as aaa from 'path';
    //             `,
    //       options: [
    //         {
    //           groups: [
    //             { name: 'node-core', test: '$node-core' },
    //             { name: 'node-modules', test: '$node-modules', sideEffect: true },
    //             { name: 'node-modules', test: '$node-modules' },
    //             { name: 'project-base', test: '^[@\\w]', sideEffect: true },
    //             { name: 'project-base', test: '^[@\\w]' },
    //             { name: 'upper-directory', test: '^\\.\\./', sideEffect: true },
    //             { name: 'upper-directory', test: '^\\.\\./' },
    //             { name: 'current-directory', test: '^\\./', sideEffect: true },
    //             { name: 'current-directory', test: '^\\./' },
    //           ],
    //           ordered: true,
    //         }
    //       ]
    //     },
    //     {
    //       code: `
    // import './foo';
    //             `,
    //       options: [
    //       ]
    //     },
    //     {
    //       code: `
    // import aaa from './foo';
    //             `,
    //       options: [
    //       ]
    //     },
    //     {
    //       code: `
    // import { aaa } from './foo';
    //             `,
    //       options: [
    //       ]
    //     },
    {
      code: `
import a = require('./foo');


import a = require('./foo');
            `,
      options: [
      ]
    },
  ],
  invalid: [
  ]
});

