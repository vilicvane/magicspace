import {AbstractWalker, IRuleMetadata, RuleFailure, Rules} from 'tslint';
import {
  ArrowFunction,
  ClassElement,
  FunctionDeclaration,
  FunctionExpression,
  GetAccessorDeclaration,
  MethodDeclaration,
  Node,
  ObjectBindingPattern,
  ObjectLiteralElement,
  ObjectLiteralExpression,
  ReturnStatement,
  SourceFile,
  forEachChild,
  isArrowFunction,
  isCallExpression,
  isFunctionDeclaration,
  isFunctionExpression,
  isGetAccessorDeclaration,
  isMethodDeclaration,
  isObjectLiteralElement,
  isObjectLiteralExpression,
  isPropertyAssignment,
  isReturnStatement,
  isVariableDeclaration,
} from 'typescript';
import {isPropertyDeclaration} from '../../../node_modules/tsutils';

import {FailureManager} from '../utils/failure-manager';

const ERROR_MESSAGE_EXPLICIT_RETURN_TYPE =
  'This function require a explicit return type.';

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

type ExplicitTypeCheckNode =
  | ArrowFunction
  | FunctionDeclaration
  | FunctionExpression
  | MethodDeclaration
  | GetAccessorDeclaration
  | ReturnStatement
  | ObjectLiteralExpression
  | ObjectBindingPattern
  | ObjectLiteralElement
  | ClassElement;

class ExplicitReturnTypeWalker extends AbstractWalker<undefined> {
  private failureManager = new FailureManager(this);

  walk(sourceFile: SourceFile): void {
    let callback = (node: Node): void => {
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

      forEachChild(node, callback);
    };

    forEachChild(sourceFile, callback);

    this.failureManager.throw();
  }

  private hasExplicitType(node: ExplicitTypeCheckNode): boolean {
    if ('type' in node && node.type) {
      // The function like node has its own return type.
      return true;
    }

    let parent = node.parent;

    if (!parent) {
      return false;
    }

    if (
      // example: [].map(() => {});
      isCallExpression(parent) ||
      // example: foo.bar = () => {};
      isPropertyAssignment(parent)
    ) {
      return true;
    }

    if (
      // example: let foo: Foo = () => {};
      isVariableDeclaration(parent) ||
      // example: class Foo {bar: Bar = () => {};}
      isPropertyDeclaration(parent)
    ) {
      return !!parent.type;
    }

    if (
      // example: return () => {};
      isReturnStatement(parent) ||
      // example: let foo: Foo = {bar() {}};
      isObjectLiteralExpression(parent) ||
      // example: let foo: Foo = {bar:() => {}}
      isObjectLiteralElement(parent)
    ) {
      return this.hasExplicitType(parent);
    }

    return false;
  }
}
