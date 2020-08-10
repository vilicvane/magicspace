import {TSESLint} from '@typescript-eslint/experimental-utils';
import {getNextStatement, isBlockLike} from 'tsutils';
import {
  Block,
  ClassDeclaration,
  ConstructorDeclaration,
  DoStatement,
  EnumDeclaration,
  ForInStatement,
  ForOfStatement,
  ForStatement,
  FunctionDeclaration,
  GetAccessorDeclaration,
  IfStatement,
  InterfaceDeclaration,
  LabeledStatement,
  MethodDeclaration,
  ModuleDeclaration,
  Node,
  ReturnStatement,
  SetAccessorDeclaration,
  Statement,
  SyntaxList,
  TryStatement,
  WhileStatement,
  forEachChild,
  isArrowFunction,
  isBlock,
  isCaseClause,
  isClassDeclaration,
  isClassExpression,
  isConstructorDeclaration,
  isDefaultClause,
  isDoStatement,
  isEnumDeclaration,
  isForInStatement,
  isForOfStatement,
  isForStatement,
  isFunctionDeclaration,
  isGetAccessorDeclaration,
  isIfStatement,
  isInterfaceDeclaration,
  isLabeledStatement,
  isMethodDeclaration,
  isModuleBlock,
  isModuleDeclaration,
  isObjectLiteralExpression,
  isPropertyDeclaration,
  isReturnStatement,
  isSetAccessorDeclaration,
  isTryStatement,
  isWhileStatement,
} from 'typescript';

import {createRule, getParserServices} from './@utils';

const messages = {
  emptyLineAroundStatementRequired:
    'An empty line is expected before the statement.',
};

type Options = [];

type MessageId = keyof typeof messages;

export const emptyLineAroundBlocksRule = createRule<Options, MessageId>({
  name: 'empty-line-around-blocks',
  meta: {
    docs: {
      description:
        'Validate and insert appropriate empty lines around block-included statements',
      category: 'Stylistic Issues',
      recommended: 'error',
    },
    messages,
    schema: [],
    type: 'layout',
    fixable: 'code',
  },
  defaultOptions: [],

  create(context) {
    const REGEX_EMPTY_LINE_IN_NON_CODE = /\n\s*\n/;

    type NodeValidator = (node: Node) => boolean;

    interface NotInElsePartIfStatement extends IfStatement {}

    interface ArrowFunctionInitializedPropertyDeclaration extends IfStatement {}

    interface PlainBlock extends Block {}

    interface MultilineReturnStatement extends ReturnStatement {}

    type BlockIncludingNode = BlockIncludingStatement;

    const BlockIncludingNodeValidators: NodeValidator[] = [
      isBlockIncludingStatement,
    ];

    type BlockIncludingStatement =
      | NotInElsePartIfStatement
      | DoStatement
      | WhileStatement
      | ForStatement
      | ForInStatement
      | ForOfStatement
      | TryStatement
      | LabeledStatement
      | MultilineReturnStatement
      | FunctionDeclaration
      | ClassDeclaration
      | ConstructorDeclaration
      | GetAccessorDeclaration
      | SetAccessorDeclaration
      | MethodDeclaration
      | InterfaceDeclaration
      | EnumDeclaration
      | ModuleDeclaration
      | ArrowFunctionInitializedPropertyDeclaration
      | PlainBlock;

    const BlockIncludingStatementValidators: NodeValidator[] = [
      isNotInElsePartIfStatement,
      isDoStatement,
      isWhileStatement,
      isForStatement,
      isForInStatement,
      isForOfStatement,
      isTryStatement,
      isLabeledStatement,
      isMultilineReturnStatement,
      isFunctionDeclaration,
      isClassDeclaration,
      isConstructorDeclaration,
      isGetAccessorDeclaration,
      isSetAccessorDeclaration,
      isMethodDeclaration,
      isInterfaceDeclaration,
      isEnumDeclaration,
      isModuleDeclaration,
      isArrowFunctionInitializedPropertyDeclaration,
      isPlainBlock,
    ];

    const parserServices = getParserServices(context);

    class EmptyLineAroundBlocksWalker {
      walkNode = (node: Node): void => {
        if (isConstructorDeclaration(node)) {
          this.walkFunctionLikeDeclaration(node);
        } else if (isFunctionDeclaration(node) || isMethodDeclaration(node)) {
          // to allow leaving no empty line between methods in ObjectLiteralExpression
          if (!isObjectLiteralExpression(node.parent)) {
            this.walkFunctionLikeDeclaration(node);
          }
        } else if (isBlockIncludingStatement(node)) {
          if (!isObjectLiteralExpression(node.parent)) {
            this.walkBlockIncludingStatement(node);
          }
        }

        forEachChild(node, this.walkNode);
      };

      private walkNextAffectedNode(node: Node): void {
        let nextStatement = getNextSibling(node);

        if (nextStatement && !isBlockIncludedNode(nextStatement)) {
          if (!this.checkNextAffectedNode(nextStatement, node)) {
            context.report({
              loc: {
                start: context
                  .getSourceCode()
                  .getLocFromIndex(nextStatement.getStart()),
                end: context
                  .getSourceCode()
                  .getLocFromIndex(nextStatement.getEnd()),
              },
              messageId: 'emptyLineAroundStatementRequired',
              fix: this.buildFixer(nextStatement),
            });
          }
        }
      }

      private walkFunctionLikeDeclaration(
        node: FunctionDeclaration | MethodDeclaration | ConstructorDeclaration,
      ): void {
        if (node.body) {
          let firstSignature;

          if (isConstructorDeclaration(node)) {
            firstSignature = getConstructorFirstSignature(node);
          } else {
            firstSignature = getFirstSignature(node);
          }

          if (firstSignature) {
            if (!this.checkBlockIncludingStatement(firstSignature)) {
              context.report({
                node: parserServices.tsNodeToESTreeNodeMap.get(firstSignature),
                messageId: 'emptyLineAroundStatementRequired',
                fix: this.buildFixer(firstSignature),
              });
            }

            this.walkNextAffectedNode(node);

            return;
          }

          this.walkBlockIncludingStatement(node);
        }
      }

      private walkBlockIncludingStatement(node: BlockIncludingStatement): void {
        if (!this.checkBlockIncludingStatement(node)) {
          context.report({
            node: parserServices.tsNodeToESTreeNodeMap.get(node),
            messageId: 'emptyLineAroundStatementRequired',
            fix: this.buildFixer(node),
          });
        }

        this.walkNextAffectedNode(node);
      }

      private checkNextAffectedNode(node: Node, lastNode: Node): boolean {
        if (node.parent !== lastNode.parent) {
          return true;
        }

        if (emptyLineExistsBeforeNode(node)) {
          return true;
        }

        return false;
      }

      private checkBlockIncludingStatement(
        node: BlockIncludingStatement,
      ): boolean {
        if (isLabeledStatement(node.parent)) {
          return true;
        }

        let parentSyntaxList = getParentSyntaxList(node);

        if (parentSyntaxList && firstInSyntaxList(node, parentSyntaxList)) {
          return true;
        }

        if (emptyLineExistsBeforeNode(node)) {
          return true;
        }

        return false;
      }

      private buildFixer(node: Node): TSESLint.ReportFixFunction {
        return (fixer: TSESLint.RuleFixer) => {
          return fixer.replaceTextRange(
            [node.getFullStart(), node.getFullStart()],
            '\n',
          );
        };
      }
    }

    function validate(node: Node, validators: NodeValidator[]): boolean {
      for (let validator of validators) {
        if (validator(node)) {
          return true;
        }
      }

      return false;
    }

    function isBlockIncludedNode(node: Node): node is BlockIncludingNode {
      return validate(node, BlockIncludingNodeValidators);
    }

    function isBlockIncludingStatement(
      node: Node,
    ): node is BlockIncludingStatement {
      return validate(node, BlockIncludingStatementValidators);
    }

    function isNotInElsePartIfStatement(
      node: Node,
    ): node is NotInElsePartIfStatement {
      if (isIfStatement(node) && !isIfStatement(node.parent)) {
        return true;
      }

      return false;
    }

    function isArrowFunctionInitializedPropertyDeclaration(
      node: Node,
    ): node is ArrowFunctionInitializedPropertyDeclaration {
      if (
        isPropertyDeclaration(node) &&
        node.initializer &&
        isArrowFunction(node.initializer)
      ) {
        return true;
      }

      return false;
    }

    function isPlainBlock(node: Node): node is PlainBlock {
      if (isBlock(node) && isBlockLike(node.parent)) {
        return true;
      }

      return false;
    }

    function isMultilineReturnStatement(
      node: Node,
    ): node is MultilineReturnStatement {
      if (isReturnStatement(node) && node.getText().indexOf('\n') !== -1) {
        return true;
      }

      return false;
    }

    function getParentSyntaxList(node: Node): SyntaxList | undefined {
      let parent = node.parent;

      let siblingCount = parent.getChildCount();

      if (
        isBlock(parent) ||
        isModuleBlock(parent) ||
        isObjectLiteralExpression(parent)
      ) {
        return parent.getChildAt(1) as SyntaxList;
      } else if (
        isClassDeclaration(parent) ||
        isInterfaceDeclaration(parent) ||
        isClassExpression(parent)
      ) {
        return parent.getChildAt(siblingCount - 2) as SyntaxList;
      } else if (isCaseClause(parent) || isDefaultClause(parent)) {
        return parent.getChildAt(siblingCount - 1) as SyntaxList;
      }

      if (parent.getChildCount() > 0) {
        return parent.getChildAt(0) as SyntaxList;
      }

      return undefined;
    }

    function findInSyntaxList(node: Node, syntaxList: SyntaxList): number {
      let childrenCount = syntaxList.getChildCount();

      for (let i = 0; i < childrenCount; i++) {
        if (syntaxList.getChildAt(i) === node) {
          return i;
        }
      }

      return -1;
    }

    function getNextSibling(node: Node): Node | undefined {
      let assumedNext = getNextStatement(node as Statement);

      if (assumedNext) {
        return assumedNext;
      }

      let syntaxList = getParentSyntaxList(node);

      if (syntaxList) {
        let nextPosition = findInSyntaxList(node, syntaxList) + 1;

        if (nextPosition && nextPosition < syntaxList.getChildCount()) {
          return syntaxList.getChildAt(nextPosition);
        }
      }

      return undefined;
    }

    function getFirstSignature<
      T extends FunctionDeclaration | MethodDeclaration
    >(node: T): T | undefined {
      let parentSyntaxList = getParentSyntaxList(node);

      let isSpecificDeclaration = isFunctionDeclaration(node)
        ? isFunctionDeclaration
        : isMethodDeclaration;

      if (parentSyntaxList && node.name) {
        let position = findInSyntaxList(node, parentSyntaxList);

        let firstSignature: T | undefined;

        for (let i = position - 1; i >= 0; i--) {
          let candidate = parentSyntaxList.getChildAt(i);

          if (
            isSpecificDeclaration(candidate) &&
            !candidate.body &&
            candidate.name &&
            candidate.name.getText() === node.name.getText()
          ) {
            firstSignature = candidate as T;

            continue;
          }

          break;
        }

        return firstSignature;
      }

      return undefined;
    }

    function getConstructorFirstSignature(
      node: ConstructorDeclaration,
    ): ConstructorDeclaration | undefined {
      let parentSyntaxList = getParentSyntaxList(node);

      if (parentSyntaxList) {
        let position = findInSyntaxList(node, parentSyntaxList);

        let firstSignature: ConstructorDeclaration | undefined;

        for (let i = position - 1; i >= 0; i--) {
          let candidate = parentSyntaxList.getChildAt(i);

          if (isConstructorDeclaration(candidate) && !candidate.body) {
            firstSignature = candidate;

            continue;
          }

          break;
        }

        return firstSignature;
      }

      return undefined;
    }

    function firstInSyntaxList(node: Node, syntaxList: SyntaxList): boolean {
      return (
        syntaxList.getChildCount() > 0 && syntaxList.getChildAt(0) === node
      );
    }

    function emptyLineExistsBeforeNode(node: Node): boolean {
      let nonCodeLength = node.getStart() - node.getFullStart();

      let nonCode = node.getFullText().slice(0, nonCodeLength);

      if (REGEX_EMPTY_LINE_IN_NON_CODE.test(nonCode)) {
        return true;
      }

      return false;
    }

    const emptyLineAroundBlocksWalker = new EmptyLineAroundBlocksWalker();

    emptyLineAroundBlocksWalker.walkNode(
      parserServices.esTreeNodeToTSNodeMap.get(context.getSourceCode().ast),
    );

    return {};
  },
});
