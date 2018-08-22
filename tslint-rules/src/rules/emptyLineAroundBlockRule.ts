import {AbstractWalker, Replacement, RuleFailure, Rules} from 'tslint';
import {
  getNextStatement,
  isBlock,
  isClassDeclaration,
  isConstructorDeclaration,
  isDoStatement,
  isEnumDeclaration,
  isForInStatement,
  isForOfStatement,
  isForStatement,
  isFunctionDeclaration,
  isIfStatement,
  isInterfaceDeclaration,
  isMethodDeclaration,
  isModuleBlock,
  isModuleDeclaration,
  isTryStatement,
  isWhileStatement,
} from 'tsutils';
import {
  ClassDeclaration,
  ConstructorDeclaration,
  DoStatement,
  EnumDeclaration,
  ForInStatement,
  ForOfStatement,
  ForStatement,
  FunctionDeclaration,
  IfStatement,
  InterfaceDeclaration,
  MethodDeclaration,
  ModuleDeclaration,
  Node,
  SourceFile,
  Statement,
  SyntaxList,
  TryStatement,
  WhileStatement,
  forEachChild,
} from 'typescript';

import {FailureManager} from '../utils/failure-manager';

const ERROR_MESSAGE_EMPTY_LINE_AROUND_STATEMENT_REQUIRED =
  'An empty line is expected before the statement.';

const REGEX_EMPTY_LINE_IN_NON_CODE = /^\s*\n\s*\n+((.|\s)*)/;

type NodeValidator = (node: Node) => boolean;

type BlockIncludedNode = BlockIncludedStatement;

const BlockIncludedNodeValidators: NodeValidator[] = [isBlockIncludedStatement];

type BlockIncludedStatement =
  | IfStatement
  | DoStatement
  | WhileStatement
  | ForStatement
  | ForInStatement
  | ForOfStatement
  | TryStatement
  | FunctionDeclaration
  | ClassDeclaration
  | ConstructorDeclaration
  | MethodDeclaration
  | InterfaceDeclaration
  | EnumDeclaration
  | ModuleDeclaration;

const BlockIncludedStatementValidators: NodeValidator[] = [
  isIfStatement,
  isDoStatement,
  isWhileStatement,
  isForStatement,
  isForInStatement,
  isForOfStatement,
  isTryStatement,
  isFunctionDeclaration,
  isClassDeclaration,
  isConstructorDeclaration,
  isMethodDeclaration,
  isInterfaceDeclaration,
  isEnumDeclaration,
  isModuleDeclaration,
];

export class Rule extends Rules.TypedRule {
  applyWithProgram(sourceFile: SourceFile): RuleFailure[] {
    return this.applyWithWalker(
      new EmptyLineAroundBlockWalker(sourceFile, this.ruleName, undefined),
    );
  }
}

class EmptyLineAroundBlockWalker extends AbstractWalker<undefined> {
  private failureManager = new FailureManager(this);

  walk(sourceFile: SourceFile): void {
    forEachChild(sourceFile, this.walkNode);
  }

  private walkNode = (node: Node): void => {
    if (isFunctionDeclaration(node)) {
      this.walkFunctionDeclaration(node);
    } else if (isBlockIncludedStatement(node)) {
      this.walkBlockIncludedStatement(node);
    }

    forEachChild(node, this.walkNode);
  };

  private walkBlockIncludedStatement(node: BlockIncludedStatement): void {
    if (!this.checkBlockIncludedStatement(node)) {
      this.failureManager.append({
        node,
        message: ERROR_MESSAGE_EMPTY_LINE_AROUND_STATEMENT_REQUIRED,
        replacement: this.buildFixer(node),
      });
    }

    let nextStatement = getNextSibling(node);

    if (nextStatement && !isBlockIncludedNode(nextStatement)) {
      if (!this.checkNextAffectedNode(nextStatement, node)) {
        this.failureManager.append({
          node: nextStatement,
          message: ERROR_MESSAGE_EMPTY_LINE_AROUND_STATEMENT_REQUIRED,
          replacement: this.buildFixer(nextStatement),
        });
      }
    }
  }

  private walkFunctionDeclaration(node: FunctionDeclaration): void {
    if (node.body) {
      let firstSignature = getFunctionDeclarationFirstSignature(node);

      if (firstSignature) {
        if (!emptyLineExistsBeforeNode(firstSignature)) {
          this.failureManager.append({
            node: firstSignature,
            message: ERROR_MESSAGE_EMPTY_LINE_AROUND_STATEMENT_REQUIRED,
            replacement: this.buildFixer(firstSignature),
          });
        }

        return;
      }

      this.walkBlockIncludedStatement(node);
    }
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

  private checkBlockIncludedStatement(node: BlockIncludedStatement): boolean {
    let parentSyntaxList = getParentSyntaxList(node);

    if (parentSyntaxList && firstInSyntaxList(node, parentSyntaxList)) {
      return true;
    }

    if (emptyLineExistsBeforeNode(node)) {
      return true;
    }

    return false;
  }

  private buildFixer(node: Node): Replacement {
    return new Replacement(node.getFullStart(), 0, '\n');
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

function isBlockIncludedNode(node: Node): node is BlockIncludedNode {
  return validate(node, BlockIncludedNodeValidators);
}

function isBlockIncludedStatement(node: Node): node is BlockIncludedStatement {
  return validate(node, BlockIncludedStatementValidators);
}

function getParentSyntaxList(node: Node): SyntaxList | undefined {
  let parent = node.parent;

  let siblingCount = parent.getChildCount();

  if (isBlock(parent) || isModuleBlock(parent)) {
    return parent.getChildAt(1) as SyntaxList;
  } else if (isClassDeclaration(parent) || isInterfaceDeclaration(parent)) {
    return parent.getChildAt(siblingCount - 2) as SyntaxList;
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
  if (isBlockIncludedStatement(node)) {
    return getNextStatement(node as Statement);
  }

  let assumedNext = getNextStatement(node as Statement);

  if (assumedNext) {
    return assumedNext;
  }

  let syntaxList = getParentSyntaxList(node);

  if (syntaxList) {
    let nextPosition = findInSyntaxList(node, syntaxList) + 1;

    if (nextPosition && nextPosition < syntaxList.getChildCount() - 1) {
      return syntaxList.getChildAt(nextPosition);
    }
  }

  return undefined;
}

function getFunctionDeclarationFirstSignature(
  node: FunctionDeclaration,
): FunctionDeclaration | undefined {
  let parentSyntaxList = getParentSyntaxList(node);

  if (parentSyntaxList && node.name) {
    let position = findInSyntaxList(node, parentSyntaxList);

    let firstSignature: FunctionDeclaration | undefined;

    for (let i = position - 1; i >= 0; i--) {
      let candidate = parentSyntaxList.getChildAt(i);

      if (
        isFunctionDeclaration(candidate) &&
        candidate.name &&
        candidate.name.getText() === node.name.getText()
      ) {
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
    syntaxList &&
    syntaxList.getChildCount() > 0 &&
    syntaxList.getChildAt(0) === node
  );
}

function emptyLineExistsBeforeNode(node: Node): boolean {
  let nonCodeLength = node.getStart() - node.getFullStart();

  let nonCode = node.getFullText().slice(0, nonCodeLength);

  if (nonCode.match(REGEX_EMPTY_LINE_IN_NON_CODE)) {
    return true;
  }

  return false;
}
