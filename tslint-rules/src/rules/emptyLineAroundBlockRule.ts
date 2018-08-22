import {AbstractWalker, Replacement, RuleFailure, Rules} from 'tslint';
import {
  getNextStatement,
  isBlock,
  isClassDeclaration,
  isDoStatement,
  isEnumDeclaration,
  isForInStatement,
  isForOfStatement,
  isForStatement,
  isFunctionDeclaration,
  isIfStatement,
  isInterfaceDeclaration,
  isTryStatement,
  isWhileStatement,
} from 'tsutils';
import {
  ClassDeclaration,
  Declaration,
  DoStatement,
  EnumDeclaration,
  ForInStatement,
  ForOfStatement,
  ForStatement,
  FunctionDeclaration,
  IfStatement,
  InterfaceDeclaration,
  ModuleDeclaration,
  Node,
  SourceFile,
  Statement,
  SyntaxList,
  TryStatement,
  WhileStatement,
  forEachChild,
  isModuleDeclaration,
} from 'typescript';

import {FailureManager} from '../utils/failure-manager';

const ERROR_MESSAGE_EMPTY_LINE_AROUND_STATEMENT_REQUIRED =
  'An empty line is expected before the statement.';
const ERROR_MESSAGE_EMPTY_LINE_AROUND_DECLARATION_REQUIRED =
  'An empty line is expected before the declaration.';

const REGEX_EMPTY_LINE_IN_NON_CODE = /^\s*\n\s*\n+((.|\s)*)/;

type NodeValidator = (node: Node) => boolean;

type BlockIncludedNode = BlockIncludedStatement | BlockIncludedDeclaration;

const BlockIncludedNodeValidators: NodeValidator[] = [
  isBlockIncludedStatement,
  isBlockIncludedDeclaration,
];

type BlockIncludedStatement =
  | IfStatement
  | DoStatement
  | WhileStatement
  | ForStatement
  | ForInStatement
  | ForOfStatement
  | TryStatement;

const BlockIncludedStatementValidators: NodeValidator[] = [
  isIfStatement,
  isDoStatement,
  isWhileStatement,
  isForStatement,
  isForInStatement,
  isForOfStatement,
  isTryStatement,
];

type BlockIncludedDeclaration =
  | FunctionDeclaration
  | ClassDeclaration
  | InterfaceDeclaration
  | EnumDeclaration
  | ModuleDeclaration;

const BlockIncludedDeclarationValidators: NodeValidator[] = [
  isFunctionDeclaration,
  isClassDeclaration,
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
    if (isBlockIncludedStatement(node)) {
      this.walkBlockIncludedStatement(node);
    } else if (isBlockIncludedDeclaration(node)) {
      this.walkBlockIncludedDeclaration(node);
    }

    forEachChild(node, this.walkNode);
  };

  private walkBlockIncludedStatement(node: Statement): void {
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

  private checkNextAffectedNode(node: Node, lastNode: Node): boolean {
    if (node.parent !== lastNode.parent) {
      return true;
    }

    if (emptyLineExistsBeforeNode(node)) {
      return true;
    }

    return false;
  }

  private checkBlockIncludedStatement(node: Statement): boolean {
    let parentSyntaxList = getParentSyntaxList(node);

    if (parentSyntaxList && firstInSyntaxList(node, parentSyntaxList)) {
      return true;
    }

    if (emptyLineExistsBeforeNode(node)) {
      return true;
    }

    return false;
  }

  private walkBlockIncludedDeclaration(node: Declaration): void {
    if (!this.checkBlockIncludedDeclaration(node)) {
      this.failureManager.append({
        node,
        message: ERROR_MESSAGE_EMPTY_LINE_AROUND_DECLARATION_REQUIRED,
        replacement: this.buildFixer(node),
      });
    }
  }

  private checkBlockIncludedDeclaration(node: Declaration): boolean {
    let parentSyntaxList = getParentSyntaxList(node);

    if (parentSyntaxList) {
      if (firstInSyntaxList(node, parentSyntaxList)) {
        return true;
      }
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

function isBlockIncludedDeclaration(
  node: Node,
): node is BlockIncludedDeclaration {
  return validate(node, BlockIncludedDeclarationValidators);
}

function getParentSyntaxList(node: Node): SyntaxList | undefined {
  let parent = node.parent;

  if (isBlock(parent)) {
    return parent.getChildAt(1) as SyntaxList;
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
    return getNextStatement(node);
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
