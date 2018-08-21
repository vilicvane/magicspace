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
  'Enough empty lines should be left around the statement.';

type WantedStatement =
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
      new EmptyLineAroundStatementsWalker(sourceFile, this.ruleName, undefined),
    );
  }
}

class EmptyLineAroundStatementsWalker extends AbstractWalker<undefined> {
  private failureManager = new FailureManager(this);

  walk(sourceFile: SourceFile): void {
    let callback = (node: Node): void => {
      if (isWantedStatement(node)) {
        if (!this.checkCertainWantedStatement(node)) {
          this.failureManager.append({
            node,
            message: ERROR_MESSAGE_EMPTY_LINE_AROUND_STATEMENT_REQUIRED,
            replacement: this.buildFixer(node),
          });
        }

        let nextStatement = getNextStatement(node);

        if (nextStatement && !isWantedStatement(nextStatement)) {
          if (!this.checkNextAffectedNode(nextStatement, node)) {
            this.failureManager.append({
              node: nextStatement,
              message: ERROR_MESSAGE_EMPTY_LINE_AROUND_STATEMENT_REQUIRED,
              replacement: this.buildFixer(nextStatement),
            });
          }
        }
      }

      forEachChild(node, callback);
    };

    forEachChild(sourceFile, callback);
  }

  checkCertainWantedStatement(node: Statement): boolean {
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

function isWantedStatement(node: Node): node is WantedStatement {
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
