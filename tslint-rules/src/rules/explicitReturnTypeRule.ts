import {AbstractWalker, IRuleMetadata, RuleFailure, Rules} from 'tslint';
import {
  isArrowFunction,
  isCallExpression,
  isFunctionDeclaration,
  isFunctionExpression,
  isGetAccessorDeclaration,
  isMethodDeclaration,
  isReturnStatement,
  isVariableDeclaration,
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

type RelatedFunctionLikeDeclaration =
  | TypeScript.ArrowFunction
  | TypeScript.FunctionDeclaration
  | TypeScript.FunctionExpression
  | TypeScript.MethodDeclaration
  | TypeScript.GetAccessorDeclaration;

class ExplicitReturnTypeWalker extends AbstractWalker<undefined> {
  private failureManager = new FailureManager(this);

  walk(sourceFile: TypeScript.SourceFile): void {
    let callback = (node: TypeScript.Node): void => {
      if (
        (isArrowFunction(node) ||
          isFunctionDeclaration(node) ||
          isFunctionExpression(node) ||
          isMethodDeclaration(node) ||
          isGetAccessorDeclaration(node)) &&
        !this.hasExplicitType(node)
      ) {
        this.failureManager.append({
          node,
          message: ERROR_MESSAGE_EXPLICIT_RETURN_TYPE,
        });
      }

      TypeScript.forEachChild(node, callback);
    };

    TypeScript.forEachChild(sourceFile, callback);

    this.failureManager.throw();
  }

  private hasExplicitType(
    node: RelatedFunctionLikeDeclaration | TypeScript.ReturnStatement,
  ): boolean {
    if ('type' in node && node.type) {
      return true;
    }

    let parent = node.parent;

    if (!parent) {
      return false;
    }

    if (isCallExpression(parent)) {
      return true;
    } else if (isVariableDeclaration(parent)) {
      return !!parent.type;
    } else if (isReturnStatement(parent)) {
      return this.hasExplicitType(parent);
    } else {
      return false;
    }
  }
}
