import {
  AbstractWalker,
  IOptions,
  IRuleMetadata,
  Replacement,
  RuleFailure,
  Rules,
} from 'tslint';
import {isAssignmentKind, isPropertyDeclaration} from 'tsutils';
import {
  ArrowFunction,
  FunctionDeclaration,
  FunctionExpression,
  GetAccessorDeclaration,
  MethodDeclaration,
  Node,
  Program,
  SourceFile,
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
  isReturnStatement,
  isVariableDeclaration,
} from 'typescript';

import {FailureManager} from '../utils/failure-manager';

const ERROR_MESSAGE_EXPLICIT_RETURN_TYPE_REQUIRED =
  'This function requires explicit return type.';

export const BASE_TYPE_STRING_SET = new Set([
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

interface ParseOptions {
  complexTypeFixer: boolean;
}

export class Rule extends Rules.TypedRule {
  private parsedOptions: ParseOptions;

  constructor(options: IOptions) {
    super(options);
    this.parsedOptions = options.ruleArguments[0] || {complexTypeFixer: false};
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
  private failureManager = new FailureManager(this);

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
          this.failureManager.append({
            node,
            message: ERROR_MESSAGE_EXPLICIT_RETURN_TYPE_REQUIRED,
            fixer: this.buildFixer(node),
          });
        }
      }

      forEachChild(node, callback);
    };

    forEachChild(sourceFile, callback);

    this.failureManager.throw();
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

    let returnType = nodeType.getCallSignatures()[0].getReturnType();

    let returnTypeString = this.typeChecker.typeToString(returnType);

    if (
      !this.options.complexTypeFixer &&
      !BASE_TYPE_STRING_SET.has(returnTypeString)
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

    return new Replacement(
      node
        .getChildren()
        .find(v => v.getText() === ')')!
        .getEnd(),
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
      let block = parent.parent;
      let functionLike = block.parent as ReturnTypeRelatedFunctionLikeDeclaration;

      return this.checkReturnType(functionLike);
    }

    return this.checkExpressionType(parent);
  }
}
