import Path from 'path';
import { RuleTester } from "./@utils/RuleTester";
import rule = require("../rules/import-path-no-parent");

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  }
});

ruleTester.run("import-path-no-parent", rule, {
  valid: [
    // {
    //   code: `import("./widget")`
    // },
    {
      code: `import * as Foo from './foo';`,
      filename: Path.join(__dirname, 'foo0')
    },
    {
      code: `import * as Bar from '../bar';`,
      filename: Path.join(__dirname, 'foo')
    },
    {
      code: `import * as A from '../../a';`,
      filename: Path.join(__dirname, 'foo')
    },
    {
      code: `import * as B from './foo/bar/aaa';`,
      filename: Path.join(__dirname, 'foo')
    },
    {
      code: `import A, { B } from './foo/bar/aaa';`,
      filename: Path.join(__dirname, 'foo')

    }
  ],
  invalid: [
    // {
    //   code: `import("./..")`
    // },
    {
      code: `import * as Foo from './foo';`,
      filename: Path.join(__dirname, 'foo'),
      errors: [{ messageId: "importPathNoParentError" }]
    },
    {
      code: `import * as Foo from '${Path.join(__dirname, '.')}';`,
      filename: Path.join(__dirname, 'foo'),
      errors: [{ messageId: "importPathNoParentError" }]
    },
    {
      code: `import * as Foo from '././..';`,
      filename: Path.join(__dirname, 'foo'),
      errors: [{ messageId: "importPathNoParentError" }]
    },
    {
      code: `import * as Foo from '.';`,
      filename: Path.join(__dirname, 'foo'),
      errors: [{ messageId: "importPathNoParentError" }]
    },
    {
      code: `import * as Foo from './';`,
      filename: Path.join(__dirname, 'foo'),
      errors: [{ messageId: "importPathNoParentError" }]
    },
    {
      code: `import * as Foo from '..';`,
      filename: Path.join(__dirname, 'foo'),
      errors: [{ messageId: "importPathNoParentError" }]
    },
    {
      code: `import * as Foo from '../';`,
      filename: Path.join(__dirname, 'foo'),
      errors: [{ messageId: "importPathNoParentError" }]
    },
    {
      code: `import * as Foo from '../..';`,
      filename: Path.join(__dirname, 'foo'),
      errors: [{ messageId: "importPathNoParentError" }]
    },
    {
      code: `import * as Foo from '../../';`,
      filename: Path.join(__dirname, 'foo'),
      errors: [{ messageId: "importPathNoParentError" }]
    }
  ]
});

