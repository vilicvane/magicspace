// import { TSESTree } from "@typescript-eslint/experimental-utils";
import { createRule } from "./@utils/ruleCreator";

export = createRule({
  name: "import-groups",
  meta: {
    docs: {
      description: `Validate that module imports are grouped as expected.`,
      category: "Stylistic Issues",
      recommended: "error",
    },
    messages: {
      importGroupsError: `{{ name }} clashes with keyword/type`,
    },
    schema: [{
      properties: {
        properties: { type: "boolean" },
        keywords: { type: "boolean" },
      },
      type: "object",
    }],
    type: "suggestion"
  },
  defaultOptions: [],

  create() {
    // const report = (node: TSESTree.Identifier) => {
    //   context.report({ messageId: "importGroupsError", data: { name: node.name }, node });
    // };

    return {

      ImportDeclaration(node) {
        console.dir(node)
      }
    };
  },
});
