import {
  AbstractWalker,
  IOptions,
  IRuleMetadata,
  Replacement,
  RuleFailure,
  Rules,
} from 'tslint';
import {getChildOfKind, isAssignmentKind} from 'tsutils';
import {
  ArrowFunction,
  FunctionDeclaration,
  FunctionExpression,
  FunctionLikeDeclaration,
  GetAccessorDeclaration,
  MethodDeclaration,
  Node,
  Program,
  SourceFile,
  SyntaxKind,
  Type,
  TypeChecker,
  forEachChild,
  isArrowFunction,
  isBinaryExpression,
  isCallExpression,
  isClassDeclaration,
  isFunctionDeclaration,
  isFunctionExpression,
  isGetAccessorDeclaration,
  isMethodDeclaration,
  isNewExpression,
  isPropertyDeclaration,
  isReturnStatement,
  isTemplateSpan,
  isVariableDeclaration,
} from 'typescript';

import {getFunctionLikeParent} from './@utils';

const ERROR_MESSAGE_EXPLICIT_RETURN_TYPE_REQUIRED =
  'This function requires explicit return type.';

export const PRIMITIVE_TYPE_STRING_SET = new Set([
  'boolean',
  'number',
  'string',
  'array',
  'tuple',
  'null',
  'undefined',
  'never',
  'void',
]);

const PROMISE_RETURN_TYPE_REGEX = /^Promise<(.+)>$/;

interface ParseOptions {
  complexTypeFixer?: boolean;
}

export class Rule extends Rules.TypedRule {
  private parsedOptions: ParseOptions;

  constructor(options: IOptions) {
    super(options);
    this.parsedOptions = options.ruleArguments[0] || {};
  }

  applyWithProgram(sourceFile: SourceFile, program: Program): RuleFailure[] {
    return this.applyWithWalker(
      new ExplicitReturnTypeWalker(
        sourceFile,
        this.ruleName,
        this.parsedOptions,
        program.getTypeChecker(),
      ),
    );
  }

  static metadata: IRuleMetadata = {
    ruleName: 'explicit-return-type',
    description: '',
    optionsDescription: '',
    options: {
      properties: {
        complexTypeFixer: {type: 'boolean'},
      },
    },
    type: 'maintainability',
    hasFix: true,
    typescriptOnly: true,
    requiresTypeInfo: true,
  };
}

type ReturnTypeRelatedFunctionLikeDeclaration =
  | ArrowFunction
  | FunctionDeclaration
  | FunctionExpression
  | MethodDeclaration
  | GetAccessorDeclaration;

class ExplicitReturnTypeWalker extends AbstractWalker<ParseOptions> {
  constructor(
    sourceFile: SourceFile,
    ruleName: string,
    options: ParseOptions,
    private readonly typeChecker: TypeChecker,
  ) {
    super(sourceFile, ruleName, options);
  }

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
          this.addFailureAtNode(
            node,
            ERROR_MESSAGE_EXPLICIT_RETURN_TYPE_REQUIRED,
            this.buildFixer(node),
          );
        }
      }

      forEachChild(node, callback);
    };

    forEachChild(sourceFile, callback);
  }

  private getMissingReturnTypeString(
    node: ReturnTypeRelatedFunctionLikeDeclaration,
  ): string | undefined {
    let nodeType: Type;

    try {
      nodeType = this.typeChecker.getTypeAtLocation(node);
    } catch (error) {
      return undefined;
    }

    let callSignatures = nodeType.getCallSignatures()[0];
    let returnType = callSignatures ? callSignatures.getReturnType() : nodeType;

    let returnTypeString = this.typeChecker.typeToString(returnType);

    let primitiveReturnType = returnTypeString;

    let promiseMatchResult = returnTypeString.match(PROMISE_RETURN_TYPE_REGEX);

    if (isModifiedWithAsync(node) && promiseMatchResult) {
      primitiveReturnType = promiseMatchResult[1];
    }

    let {complexTypeFixer = false} = this.options;

    if (
      !complexTypeFixer &&
      !PRIMITIVE_TYPE_STRING_SET.has(primitiveReturnType)
    ) {
      return undefined;
    }

    return returnTypeString;
  }

  private buildFixer(
    node: ReturnTypeRelatedFunctionLikeDeclaration,
  ): Replacement | undefined {
    if (!node.body) {
      return undefined;
    }

    let missingReturnTypeString = this.getMissingReturnTypeString(node);

    if (!missingReturnTypeString) {
      return undefined;
    }

    let closeParenToken = getChildOfKind(node, SyntaxKind.CloseParenToken);

    if (!closeParenToken) {
      return undefined;
    }

    return new Replacement(
      closeParenToken.getEnd(),
      0,
      `: ${missingReturnTypeString}`,
    );
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

    if (isMethodDeclaration(node) && isClassDeclaration(node.parent)) {
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
      // `${() => {}}`;
      isTemplateSpan(parent) ||
      // new Foo(() => {})
      isNewExpression(parent) ||
      // foo.bar = () => {};
      (isBinaryExpression(parent) &&
        isAssignmentKind(parent.operatorToken.kind))
    ) {
      return true;
    }

    if (isArrowFunction(parent)) {
      // foo: () => () => {};
      return this.checkReturnType(parent);
    }

    if (isReturnStatement(parent)) {
      // return () => {};
      let functionLikeParent = getFunctionLikeParent(parent);

      if (
        functionLikeParent &&
        isReturnTypeRelatedFunctionLikeDeclaration(functionLikeParent)
      ) {
        return this.checkReturnType(functionLikeParent);
      } else {
        // Actually return statement should be invalid here in setter and
        // constructor.
        return true;
      }
    }

    return this.checkExpressionType(parent);
  }
}

function isReturnTypeRelatedFunctionLikeDeclaration(
  node: FunctionLikeDeclaration,
): node is ReturnTypeRelatedFunctionLikeDeclaration {
  return (
    isFunctionDeclaration(node) ||
    isFunctionExpression(node) ||
    isArrowFunction(node) ||
    isMethodDeclaration(node) ||
    isGetAccessorDeclaration(node)
  );
}

function isModifiedWithAsync(
  node: ReturnTypeRelatedFunctionLikeDeclaration,
): boolean {
  let {modifiers} = node;

  if (modifiers && modifiers.length) {
    for (let modifier of modifiers) {
      if (modifier.kind === SyntaxKind.AsyncKeyword) {
        return true;
      }
    }
  }

  return false;
}
