import {AST_NODE_TYPES, TSESTree} from '@typescript-eslint/experimental-utils';
import * as _ from 'lodash';
import ts from 'typescript';

import {createRule, getParserServices} from './@utils';

const messages = {
  strictKeyOrder:
    'The key {{key}} is in wrong position or missing in "{{type}}".',
};

type Options = [];

type MessageId = keyof typeof messages;

export const strictKeyOrderRule = createRule<Options, MessageId>({
  name: 'strict-key-order',
  meta: {
    docs: {
      description:
        'Check if the order of object keys matchs the order of the type',
      category: 'Stylistic Issues',
      recommended: 'error',
    },
    messages,
    schema: [],
    type: 'suggestion',
  },
  defaultOptions: [],

  create(context) {
    const parserServices = getParserServices(context);
    let typeChecker = parserServices.program.getTypeChecker();

    function mapIteratorToArray(iterator: ts.Iterator<ts.__String>): string[] {
      let result: string[] = [];

      for (
        let iterResult = iterator.next();
        !iterResult.done;
        iterResult = iterator.next()
      ) {
        result.push(iterResult.value as string);
      }

      return result;
    }

    function check(node: TSESTree.VariableDeclarator): void {
      let typeAnnotation = node.id.typeAnnotation;
      let init = node.init;

      if (
        !typeAnnotation ||
        typeAnnotation.typeAnnotation.type !== AST_NODE_TYPES.TSTypeReference ||
        !init ||
        init.type !== AST_NODE_TYPES.ObjectExpression
      ) {
        return;
      }

      let comments = context
        .getSourceCode()
        .getCommentsBefore(typeAnnotation.typeAnnotation);

      let strictOrderSpecified = _.some(
        comments.map(comment => {
          return comment.value.trim() === '@strict-order';
        }),
      );

      if (!strictOrderSpecified) {
        return;
      }

      let typeNode = parserServices.esTreeNodeToTSNodeMap.get(
        typeAnnotation.typeAnnotation,
      );

      let keys = mapIteratorToArray(
        typeChecker.getTypeAtLocation(typeNode).symbol.members!.keys(),
      );

      let propertyKeyInfos = _.compact(
        init.properties.map((property, index) => {
          if (
            property.type !== AST_NODE_TYPES.Property ||
            property.key.type !== AST_NODE_TYPES.Literal
          ) {
            return undefined;
          }

          return {key: property.key.value, index};
        }),
      );

      let i = 0;
      let j = 0;

      while (i < keys.length && j < propertyKeyInfos.length) {
        if (keys[i] === propertyKeyInfos[j].key) {
          ++i;
          ++j;

          continue;
        }

        ++i;
      }

      if (j < propertyKeyInfos.length) {
        let property = init.properties[
          propertyKeyInfos[j].index
        ] as TSESTree.Property;

        context.report({
          node: property.key,
          messageId: 'strictKeyOrder',
          data: {
            key: propertyKeyInfos[j].key,
            type: context
              .getSourceCode()
              .getText(typeAnnotation.typeAnnotation),
          },
        });
      }
    }

    return {
      VariableDeclarator: check,
    };
  },
});
