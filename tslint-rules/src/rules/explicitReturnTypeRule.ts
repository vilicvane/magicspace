import {AbstractWalker, IRuleMetadata, RuleFailure, Rules} from 'tslint';
import {
  isArrowFunction,
  isCallExpression,
  isFunctionDeclaration,
  isFunctionExpression,
  isGetAccessorDeclaration,
  isMethodDeclaration,
  isReturnStatement,
<<<<<<< HEAD
=======
  isVariableDeclaration,
>>>>>>> import-path-convention
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
<<<<<<< HEAD
    let cb = (node: TypeScript.Node): void => {
=======
    let callback = (node: TypeScript.Node): void => {
>>>>>>> import-path-convention
      if (
        (isArrowFunction(node) ||
          isFunctionDeclaration(node) ||
          isFunctionExpression(node) ||
<<<<<<< HEAD
          isMethodDeclaration(node)) &&
        !this.missingType(node)
=======
          isMethodDeclaration(node) ||
          isGetAccessorDeclaration(node)) &&
        !this.hasExplicitType(node)
>>>>>>> import-path-convention
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

<<<<<<< HEAD
  private missingType(node: TypeScript.Node): boolean {
    let {type} = node as TypeScript.VariableDeclaration;
=======
  private hasExplicitType(
    node: RelatedFunctionLikeDeclaration | TypeScript.ReturnStatement,
  ): boolean {
    if ('type' in node && (node as any).type) {
      return true;
    }

    let parent = node.parent;

    if (!parent) {
      return false;
    }
>>>>>>> import-path-convention

    if (isCallExpression(parent)) {
      return true;
<<<<<<< HEAD
    } else if (node.parent) {
      let parent = node.parent;

      if (isCallExpression(parent)) {
        return true;
      } else if ((parent as TypeScript.VariableDeclaration).type) {
        return true;
      } else if (isReturnStatement(parent)) {
        return this.missingType(parent);
      } else {
        return false;
      }
=======
    } else if (isVariableDeclaration(parent)) {
      return !!parent.type;
    } else if (isReturnStatement(parent)) {
      return this.hasExplicitType(parent);
>>>>>>> import-path-convention
    } else {
      return false;
    }
  }
}
