import {AST_NODE_TYPES, TSESTree} from '@typescript-eslint/experimental-utils';
import * as jsdiff from 'diff';
import * as _ from 'lodash';
import ts from 'typescript';

import {createRule, getParserServices} from './@utils';

const messages = {
  wrongPosition: 'The key "{{key}}" is in wrong position.',
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
    interface PropertyKeyInfo {
      key: string;
      index: number;
    }

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
          return comment.value.trim() === 'strict-key-order';
        }),
      );

      if (!strictOrderSpecified) {
        return;
      }

      let typeNode = parserServices.esTreeNodeToTSNodeMap.get(
        typeAnnotation.typeAnnotation,
      );

      let typeKeys = mapIteratorToArray(
        typeChecker.getTypeAtLocation(typeNode).symbol.members!.keys(),
      );

      let propertyKeyInfos: PropertyKeyInfo[] = _.compact(
        init.properties.map((property, index) => {
          if (property.type !== AST_NODE_TYPES.Property) {
            return undefined;
          }

          if (property.key.type === AST_NODE_TYPES.Literal) {
            return {key: property.key.value as string, index};
          }

          if (property.key.type === AST_NODE_TYPES.Identifier) {
            return {key: property.key.name, index};
          }

          return undefined;
        }),
      );
      let propertyKeys = propertyKeyInfos.map(
        propertyKeyInfo => propertyKeyInfo.key,
      );

      let typeKeySet = new Set(typeKeys);

      let diffResult = jsdiff.diffArrays(typeKeys, propertyKeys);

      let propertyKeyIndex = 0;

      for (let diffResultPart of diffResult) {
        if (diffResultPart.added) {
          for (let i = 0; i < diffResultPart.value.length; ++i) {
            let key = diffResultPart.value[i];
            let property = init.properties[
              propertyKeyInfos[propertyKeyIndex + i].index
            ] as TSESTree.Property;

            if (typeKeySet.has(key)) {
              context.report({
                node: property.key,
                messageId: 'wrongPosition',
                data: {
                  key,
                },
              });
            }
          }
        }

        if (!diffResultPart.removed) {
          propertyKeyIndex += diffResultPart.value.length;
        }
      }
    }

    return {
      VariableDeclarator: check,
    };
  },
});
