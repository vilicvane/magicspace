import {AST_NODE_TYPES, TSESTree} from '@typescript-eslint/experimental-utils';

import {createRule} from './@utils';

type Modifier = 'private' | 'protected' | 'public';

export const noEmptyConstructorRule = createRule({
  name: 'no-empty-constructor',
  meta: {
    docs: {
      description: ``,
      category: 'Best Practices',
      recommended: 'error',
    },
    messages: {
      constructorEmpty: `The constructor cannot be empty.`,
    },
    schema: [],
    type: 'suggestion',
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
      parameters: TSESTree.Parameter[],
    ): boolean {
      if (parameters.length) {
        return true;
      }

      return false;
    }

    function isAllowConstructorBody(
      blockStatement: TSESTree.BlockStatement | null | undefined,
    ): boolean {
      if (!blockStatement) {
        return false;
      }

      return blockStatement.body.length !== 0;
    }

    function isAllowConstructorModifierKeyWord(
      modifier: Modifier | undefined,
    ): boolean {
      if (modifier) {
        if (modifier === 'protected' || modifier === 'private') {
          return true;
        }
      }

      return false;
    }

    return {
      MethodDefinition(node) {
        if (isConstructor(node)) {
          if (
            isAllowConstructorModifierKeyWord(node.accessibility) ||
            isAllowConstructorBody(node.value.body) ||
            isAllowArgumentsModifierKeyWord(node.value.params)
          ) {
            return;
          }

          context.report({node, messageId: 'constructorEmpty'});
        }
      },
    };
  },
});
