import {AbstractWalker, RuleFailure, Rules} from 'tslint';
import {
  isDoStatement,
  isForStatement,
  isTryStatement,
  isWhileStatement,
} from 'tsutils';
import {
  Node,
  SourceFile,
  Statement,
  forEachChild,
  isForInStatement,
  isForOfStatement,
  isIfStatement,
} from 'typescript';

import {FailureManager} from '../utils/failure-manager';

const ERROR_MESSAGE_EMPTY_LINE_AROUND_STATEMENT_REQUIRED =
  'Enough empty lines should be left around the statement.';

export class Rule extends Rules.TypedRule {
  applyWithProgram(sourceFile: SourceFile): RuleFailure[] {
    return this.applyWithWalker(
      new EmptyLineAroundStatementsWalker(sourceFile, this.ruleName, undefined),
    );
  }
}

class EmptyLineAroundStatementsWalker extends AbstractWalker<undefined> {
  private failureManager = new FailureManager(this);

  private lastWalkedByStatement: Statement | undefined;

  walk(sourceFile: SourceFile): void {
    let callback = (node: Node): void => {
      if (
        isIfStatement(node) ||
        isDoStatement(node) ||
        isWhileStatement(node) ||
        isForStatement(node) ||
        isForInStatement(node) ||
        isForOfStatement(node) ||
        isTryStatement(node)
      ) {
        console.log('hello there?');

        if (!this.checkIfStatementIsQualified(node)) {
          this.failureManager.append({
            node,
            message: ERROR_MESSAGE_EMPTY_LINE_AROUND_STATEMENT_REQUIRED,
          });
        }

        this.lastWalkedByStatement = node;
      } else if (this.lastWalkedByStatement) {
        this.lastWalkedByStatement = undefined;
      }

      forEachChild(node, callback);
    };

    forEachChild(sourceFile, callback);
  }

  checkIfStatementIsQualified(node: Statement): boolean {
    let parent = node.parent;

    if (parent.getChildAt(0) === node) {
      console.log('first child priority');

      return true;
    }

    let nonCodeLength = node.getStart() - node.getFullStart();

    let nonCode = node.getFullText().slice(0, nonCodeLength - 1);

    console.log(nonCode);

    return true;
  }
}
