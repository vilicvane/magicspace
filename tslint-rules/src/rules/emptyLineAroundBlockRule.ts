import {AbstractWalker, Replacement, RuleFailure, Rules} from 'tslint';
import {
  getNextStatement,
  isDoStatement,
  isForStatement,
  isTryStatement,
  isWhileStatement,
} from 'tsutils';
import {
  DoStatement,
  ForInStatement,
  ForOfStatement,
  ForStatement,
  IfStatement,
  Node,
  SourceFile,
  Statement,
  TryStatement,
  WhileStatement,
  forEachChild,
  isBlock,
  isForInStatement,
  isForOfStatement,
  isIfStatement,
} from 'typescript';

import {FailureManager} from '../utils/failure-manager';

const ERROR_MESSAGE_EMPTY_LINE_AROUND_STATEMENT_REQUIRED =
  'An empty line is expected before the statement.';

type BlockIncludedStatement =
  | IfStatement
  | DoStatement
  | WhileStatement
  | ForStatement
  | ForInStatement
  | ForOfStatement
  | TryStatement;

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

  walkNode = (node: Node): void => {
    if (isBlockIncludedStatement(node)) {
      this.walkBlockIncludedStatement(node);
    }

    forEachChild(node, this.walkNode);
  };

  walkBlockIncludedStatement(node: Statement): void {
    if (!this.checkBlockIncludedStatement(node)) {
      this.failureManager.append({
        node,
        message: ERROR_MESSAGE_EMPTY_LINE_AROUND_STATEMENT_REQUIRED,
        replacement: this.buildFixer(node),
      });
    }

    let nextStatement = getNextStatement(node);

    if (nextStatement && !isBlockIncludedStatement(nextStatement)) {
      if (!this.checkNextAffectedNode(nextStatement, node)) {
        this.failureManager.append({
          node: nextStatement,
          message: ERROR_MESSAGE_EMPTY_LINE_AROUND_STATEMENT_REQUIRED,
          replacement: this.buildFixer(nextStatement),
        });
      }
    }
  }

  checkBlockIncludedStatement(node: Statement): boolean {
    let parent = node.parent;

    if (isBlock(parent)) {
      let syntaxList = parent.getChildAt(1);

      if (firstInSyntaxList(node, syntaxList)) {
        return true;
      }
    }

    if (parent.getChildCount() > 1) {
      let syntaxList = parent.getChildAt(0);

      if (firstInSyntaxList(node, syntaxList)) {
        return true;
      }
    }

    if (emptyLineExistsBeforeNode(node)) {
      return true;
    }

    return false;
  }

  checkNextAffectedNode(node: Node, lastNode: Node): boolean {
    if (node.parent !== lastNode.parent) {
      return true;
    }

    if (emptyLineExistsBeforeNode(node)) {
      return true;
    }

    return false;
  }

  buildFixer(node: Node): Replacement {
    return new Replacement(node.getFullStart(), 0, '\n');
  }
}

function isBlockIncludedStatement(node: Node): node is BlockIncludedStatement {
  return (
    isIfStatement(node) ||
    isDoStatement(node) ||
    isWhileStatement(node) ||
    isForStatement(node) ||
    isForInStatement(node) ||
    isForOfStatement(node) ||
    isTryStatement(node)
  );
}

function firstInSyntaxList(node: Node, syntaxList: Node): boolean {
  return (
    syntaxList &&
    syntaxList.getChildCount() > 1 &&
    syntaxList.getChildAt(0) === node
  );
}

function emptyLineExistsBeforeNode(node: Node): boolean {
  let nonCodeLength = node.getStart() - node.getFullStart();

  let nonCode = node.getFullText().slice(0, nonCodeLength);

  if (nonCode.match(/^\s*\n\s*\n+((.|\s)*)/)) {
    return true;
  }

  return false;
}
