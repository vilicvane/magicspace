import {
  ArrowFunction,
  FunctionDeclaration,
  FunctionExpression,
  FunctionLikeDeclaration,
  GetAccessorDeclaration,
  MethodDeclaration,
  Node,
  SourceFile,
  SyntaxKind,
  Type,
  TypeChecker,
  forEachChild,
  isArrowFunction,
  isBinaryExpression,
  isCallExpression,
  isClassDeclaration,
  isFunctionDeclaration,
  isFunctionExpression,
  isGetAccessorDeclaration,
  isMethodDeclaration,
  isNewExpression,
  isPropertyDeclaration,
  isReturnStatement,
  isTemplateSpan,
  isVariableDeclaration,
} from 'typescript';
import {getChildOfKind, isAssignmentKind} from 'tsutils';

import {createRule, getFunctionLikeParent} from './@utils';
import {TSESLint, ParserServices} from '@typescript-eslint/experimental-utils';

const messages = {
  explicitReturnTypeRequired: 'This function requires explicit return type.',
};

type Options = [
  {
    complexTypeFixer?: boolean;
  },
];

type MessageId = keyof typeof messages;

export const explicitReturnTypeRule = createRule<Options, MessageId>({
  name: 'explicit-return-type',
  meta: {
    type: 'suggestion',
    docs: {
      description: '',
      category: 'Stylistic Issues',
      recommended: 'error',
    },
    messages,
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          complexTypeFixer: {
            type: 'boolean',
          },
        },
      },
    ],
  },
  defaultOptions: [
    {
      complexTypeFixer: false,
    },
  ],

  create(context, [options]) {
    const PRIMITIVE_TYPE_STRING_SET = new Set([
      'boolean',
      'number',
      'string',
      'array',
      'tuple',
      'null',
      'undefined',
      'never',
      'void',
    ]);

    const PROMISE_RETURN_TYPE_REGEX = /^Promise<(.+)>$/;

    type ReturnTypeRelatedFunctionLikeDeclaration =
      | ArrowFunction
      | FunctionDeclaration
      | FunctionExpression
      | MethodDeclaration
      | GetAccessorDeclaration;

    class ExplicitReturnTypeWalker {
      constructor(private readonly typeChecker: TypeChecker) {}

      walk(sourceFile: SourceFile): void {
        let callback = (node: Node): void => {
          if (
            isArrowFunction(node) ||
            isFunctionDeclaration(node) ||
            isFunctionExpression(node) ||
            isMethodDeclaration(node) ||
            isGetAccessorDeclaration(node)
          ) {
            if (!this.checkReturnType(node)) {
              context.report({
                node: parserServices.tsNodeToESTreeNodeMap.get(node),
                messageId: 'explicitReturnTypeRequired',
                fix: this.buildFixer(node),
              });
            }
          }

          forEachChild(node, callback);
        };

        forEachChild(sourceFile, callback);
      }

      private getMissingReturnTypeString(
        node: ReturnTypeRelatedFunctionLikeDeclaration,
      ): string | undefined {
        let nodeType: Type;

        try {
          nodeType = this.typeChecker.getTypeAtLocation(node);
        } catch (error) {
          return undefined;
        }

        let callSignature = nodeType.getCallSignatures()[0];
        let returnType = callSignature
          ? callSignature.getReturnType()
          : nodeType;

        let returnTypeString = this.typeChecker.typeToString(returnType);

        let primitiveReturnType = returnTypeString;

        let promiseMatchResult = returnTypeString.match(
          PROMISE_RETURN_TYPE_REGEX,
        );

        if (isModifiedWithAsync(node) && promiseMatchResult) {
          primitiveReturnType = promiseMatchResult[1];
        }

        let {complexTypeFixer = false} = options;

        if (
          !complexTypeFixer &&
          !PRIMITIVE_TYPE_STRING_SET.has(primitiveReturnType)
        ) {
          return undefined;
        }

        return returnTypeString;
      }

      private buildFixer(
        node: ReturnTypeRelatedFunctionLikeDeclaration,
      ): TSESLint.ReportFixFunction | undefined {
        if (!node.body) {
          return undefined;
        }

        let missingReturnTypeString = this.getMissingReturnTypeString(node);

        if (!missingReturnTypeString) {
          return undefined;
        }

        let closeParenToken = getChildOfKind(node, SyntaxKind.CloseParenToken);

        if (!closeParenToken) {
          return undefined;
        }

        return fixer =>
          fixer.replaceTextRange(
            [closeParenToken!.getEnd(), closeParenToken!.getEnd()],
            `: ${missingReturnTypeString}`,
          );
      }

      private checkReturnType(
        node: ReturnTypeRelatedFunctionLikeDeclaration,
      ): boolean {
        if (node.type) {
          return true;
        }

        if (isFunctionDeclaration(node)) {
          // function foo() {}
          return false;
        }

        if (isMethodDeclaration(node) && isClassDeclaration(node.parent)) {
          // class Foo {bar() {}}
          return false;
        }

        return this.checkExpressionType(node);
      }

      private checkExpressionType(node: Node): boolean {
        let parent = node.parent;

        if (!parent) {
          return false;
        }

        if (
          // let foo: Foo = () => {};
          isVariableDeclaration(parent) ||
          // class Foo {bar: Bar = () => {};}
          isPropertyDeclaration(parent)
        ) {
          return !!parent.type;
        }

        if (
          // [].map(() => {});
          isCallExpression(parent) ||
          // `${() => {}}`;
          isTemplateSpan(parent) ||
          // new Foo(() => {})
          isNewExpression(parent) ||
          // foo.bar = () => {};
          (isBinaryExpression(parent) &&
            isAssignmentKind(parent.operatorToken.kind))
        ) {
          return true;
        }

        if (isArrowFunction(parent)) {
          // foo: () => () => {};
          return this.checkReturnType(parent);
        }

        if (isReturnStatement(parent)) {
          // return () => {};
          let functionLikeParent = getFunctionLikeParent(parent);

          if (
            functionLikeParent &&
            isReturnTypeRelatedFunctionLikeDeclaration(functionLikeParent)
          ) {
            return this.checkReturnType(functionLikeParent);
          } else {
            // Actually return statement should be invalid here in setter and
            // constructor.
            return true;
          }
        }

        return this.checkExpressionType(parent);
      }
    }

    function isReturnTypeRelatedFunctionLikeDeclaration(
      node: FunctionLikeDeclaration,
    ): node is ReturnTypeRelatedFunctionLikeDeclaration {
      return (
        isFunctionDeclaration(node) ||
        isFunctionExpression(node) ||
        isArrowFunction(node) ||
        isMethodDeclaration(node) ||
        isGetAccessorDeclaration(node)
      );
    }

    function isModifiedWithAsync(
      node: ReturnTypeRelatedFunctionLikeDeclaration,
    ): boolean {
      let {modifiers} = node;

      if (modifiers && modifiers.length) {
        for (let modifier of modifiers) {
          if (modifier.kind === SyntaxKind.AsyncKeyword) {
            return true;
          }
        }
      }

      return false;
    }

    type RequiredParserServices = {
      [k in keyof ParserServices]: Exclude<ParserServices[k], undefined>;
    };

    function getParserServices<
      TMessageIds extends string,
      TOptions extends unknown[]
    >(
      context: TSESLint.RuleContext<TMessageIds, TOptions>,
    ): RequiredParserServices {
      if (
        !context.parserServices ||
        !context.parserServices.program ||
        !context.parserServices.esTreeNodeToTSNodeMap
      ) {
        /**
         * The user needs to have configured "project" in their parserOptions
         * for @typescript-eslint/parser
         */
        throw new Error(
          'You have used a rule which requires parserServices to be generated. You must therefore provide a value for the "parserOptions.project" property for @typescript-eslint/parser.',
        );
      }

      return context.parserServices as RequiredParserServices;
    }

    const parserServices = getParserServices(context);

    new ExplicitReturnTypeWalker(parserServices.program.getTypeChecker()).walk(
      parserServices.esTreeNodeToTSNodeMap.get(context.getSourceCode().ast),
    );

    return {};
  },
});
