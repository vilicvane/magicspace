import { createRule } from "./@utils/ruleCreator";
import {
  AST_NODE_TYPES,
  TSESLint,
  TSESTree,
} from '@typescript-eslint/experimental-utils';

export = createRule({
  name: "no-empty-constructor",
  meta: {
    docs: {
      description: ``,
      category: "Best Practices",
      recommended: "error",
    },
    messages: {
      constructorEmpty: `The constructor cannot be empty.`,
    },
    schema: [],
    type: "suggestion"
  },
  defaultOptions: [],

  create(context) {
    function isConstructor(node: TSESTree.Node): boolean {
      return (
        node.type === AST_NODE_TYPES.MethodDefinition &&
        node.kind === 'constructor'
      );
    }
    function isAllowArgumentsModifierKeyWord(
      parameters: NodeArray<ParameterDeclaration>,
    ): boolean {
      if (parameters.length) {
        return true;
      }

      return false;
    }

    function isAllowConstructorBody(body: Block | undefined): boolean {
      if (!body) {
        return false;
      }

      return (
        body
          .getChildren()[1]
          .getText()
          .trim() !== ''
      );
    }

    function isAllowConstructorModifierKeyWord(
      modifiers: NodeArray<Modifier> | undefined,
    ): boolean {
      let { ProtectedKeyword, PrivateKeyword } = SyntaxKind;

      if (modifiers && modifiers.length) {
        for (let modifier of modifiers) {
          if (
            modifier.kind === ProtectedKeyword ||
            modifier.kind === PrivateKeyword
          ) {
            return true;
          }
        }
      }

      return false;
    }

    return {
      MethodDefinition(node: TSESTree.Node) {
        if (isConstructor(node)) {
          if (
            isAllowConstructorModifierKeyWord(node.modifiers) ||
            isAllowConstructorBody(node.body) ||
            isAllowArgumentsModifierKeyWord(node.parameters)
          ) {
            return;
          }

          context.report({ node, messageId: "constructorEmpty" });
        }
      }
    };
  },
});
