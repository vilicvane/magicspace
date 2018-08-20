import {
  FunctionLikeDeclaration,
  Node,
  isArrowFunction,
  isConstructorDeclaration,
  isFunctionDeclaration,
  isFunctionExpression,
  isGetAccessorDeclaration,
  isMethodDeclaration,
  isSetAccessorDeclaration,
} from 'typescript';

export function isFunctionLikeDeclaration(
  node: Node,
): node is FunctionLikeDeclaration {
  return (
    isArrowFunction(node) ||
    isFunctionDeclaration(node) ||
    isFunctionExpression(node) ||
    isMethodDeclaration(node) ||
    isGetAccessorDeclaration(node) ||
    isSetAccessorDeclaration(node) ||
    isConstructorDeclaration(node)
  );
}

export function getFunctionLikeParent(
  node: Node,
): FunctionLikeDeclaration | undefined {
  let parent: Node | undefined = node;

  // tslint:disable-next-line:no-conditional-assignment
  while ((parent = parent.parent)) {
    if (isFunctionLikeDeclaration(parent)) {
      return parent;
    }
  }

  return undefined;
}
