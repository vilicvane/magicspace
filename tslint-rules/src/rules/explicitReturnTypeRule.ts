import {AbstractWalker, IRuleMetadata, RuleFailure, Rules} from 'tslint';
import {
  ArrowFunction,
  FunctionDeclaration,
  FunctionExpression,
  GetAccessorDeclaration,
  MethodDeclaration,
  Node,
  SourceFile,
  SyntaxKind,
  forEachChild,
  isArrowFunction,
  isBinaryExpression,
  isCallExpression,
  isClassDeclaration,
  isFunctionDeclaration,
  isFunctionExpression,
  isGetAccessorDeclaration,
  isMethodDeclaration,
  isReturnStatement,
  isVariableDeclaration,
} from 'typescript';
import {
  isAssignmentKind,
  isPropertyDeclaration,
} from '../../../node_modules/tsutils';

import {FailureManager} from '../utils/failure-manager';

const ERROR_MESSAGE_EXPLICIT_RETURN_TYPE_REQUIRED =
  'This function requires explicit return type.';

export class Rule extends Rules.AbstractRule {
  apply(sourceFile: SourceFile): RuleFailure[] {
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

type ReturnTypeRelatedFunctionLikeDeclaration =
  | ArrowFunction
  | FunctionDeclaration
  | FunctionExpression
  | MethodDeclaration
  | GetAccessorDeclaration;

class ExplicitReturnTypeWalker extends AbstractWalker<undefined> {
  private failureManager = new FailureManager(this);

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
          this.failureManager.append({
            node,
            message: ERROR_MESSAGE_EXPLICIT_RETURN_TYPE_REQUIRED,
          });
        }
      }

      forEachChild(node, callback);
    };

    forEachChild(sourceFile, callback);

    this.failureManager.throw();
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

    if (isMethodDeclaration(node) && isClassDeclaration(node.parent!)) {
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
      // foo.bar = () => {};
      (isBinaryExpression(parent) &&
        isAssignmentKind(parent.operatorToken.kind))
    ) {
      return true;
    }

    if (isArrowFunction(parent)) {
      // example foo: () => () => {};
      return this.checkReturnType(parent);
    }

    if (isReturnStatement(parent)) {
      // return () => {};
      let block = parent.parent!;
      let declaration = block.parent! as ReturnTypeRelatedFunctionLikeDeclaration;

      return this.checkReturnType(declaration);
    }

    return this.checkExpressionType(parent);
  }
}
