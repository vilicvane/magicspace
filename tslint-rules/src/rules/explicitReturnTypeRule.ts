import {AbstractWalker, IRuleMetadata, RuleFailure, Rules} from 'tslint';
import {
  isArrowFunction,
  isFunctionDeclaration,
  isFunctionExpression,
  isMethodDeclaration,
} from 'tsutils';
import * as TypeScript from 'typescript';
import {FailureManager} from '../utils/failure-manager';

const ERROR_MESSAGE_EXPLICIT_RETURN_TYPE =
  'This function require a explicit return type.';

export class Rule extends Rules.AbstractRule {
  apply(sourceFile: TypeScript.SourceFile): RuleFailure[] {
    return this.applyWithWalker(
      new ExplicitReturnTypeWalker(
        sourceFile,
        Rule.metadata.ruleName,
        undefined,
      ),
    );
  }

  static metadata: IRuleMetadata = {
    ruleName: 'explicit-return-type',
    description: '',
    optionsDescription: '',
    options: undefined,
    type: 'maintainability',
    hasFix: true,
    typescriptOnly: false,
  };
}

class ExplicitReturnTypeWalker extends AbstractWalker<undefined> {
  private failureManager = new FailureManager(this);

  walk(sourceFile: TypeScript.SourceFile): void {
    let cb = (node: TypeScript.Node) => {
      if (
        (isArrowFunction(node) ||
          isFunctionDeclaration(node) ||
          isFunctionExpression(node) ||
          isMethodDeclaration(node)) &&
        !this.printType(node)
      ) {
        this.failureManager.append({
          node,
          message: ERROR_MESSAGE_EXPLICIT_RETURN_TYPE,
        });
      }

      TypeScript.forEachChild(node, cb);
    };

    TypeScript.forEachChild(sourceFile, cb);

    this.failureManager.throw();
  }

  private printType(node: TypeScript.Node): boolean {
    let {type} = node as TypeScript.VariableDeclaration;

    if (type) {
      return true;
    } else if (node.parent) {
      return this.printType(node.parent);
    } else {
      return false;
    }
  }
}
