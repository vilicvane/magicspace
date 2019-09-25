import { RuleTester } from "./@utils/RuleTester";
import rule from "../rules/no-empty-constructor";

const ruleTester = new RuleTester({
  parser: require.resolve("@typescript-eslint/parser"),
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module",
  }
});

ruleTester.run("no-empty-constructor", rule, {
  valid: [
  ],
  invalid: [
    {
      code: `
class A {
  constructor() {}
}
            `,
      errors: [{ messageId: "constructorEmpty" }]
    },
  ]
});

