import {
    AbstractWalker,
    IOptions,
    IRuleMetadata,
    Replacement,
    RuleFailure,
    Rules,
} from 'tslint';
import { isAssignmentKind, isPropertyDeclaration } from 'tsutils';
import {
    ArrowFunction,
    FunctionDeclaration,
    FunctionExpression,
    GetAccessorDeclaration,
    MethodDeclaration,
    ModuleKind,
    Node,
    ScriptTarget,
    SourceFile,
    TypeChecker,
    createProgram,
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

import { BASE_TYPES } from '../@lang';
import { FailureManager } from '../utils/failure-manager';

const ERROR_MESSAGE_EXPLICIT_RETURN_TYPE_REQUIRED =
    'This function requires explicit return type.';

let typeChecker: TypeChecker | undefined

interface ParseOptions {
    complexTypeFixer: boolean
}

export class Rule extends Rules.AbstractRule {

    private parseOptions: ParseOptions

    constructor(options: IOptions) {
        super(options)
        this.parseOptions = options.ruleArguments[0] || { complexTypeFixer: false }
    }

    apply(sourceFile: SourceFile): RuleFailure[] {
        return this.applyWithWalker(
            new ExplicitReturnTypeWalker(
                sourceFile,
                Rule.metadata.ruleName,
                this.parseOptions,
            ),
        );
    }

    static metadata: IRuleMetadata = {
        ruleName: 'explicit-return-type',
        description: '',
        optionsDescription: '',
        options: {
            properties: {
                complexTypeFixer: { type: 'boolean' }
            }
        },
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

class ExplicitReturnTypeWalker extends AbstractWalker<ParseOptions> {
    private failureManager = new FailureManager(this);
    private typeChecker: TypeChecker;

    constructor(sourceFile: SourceFile, ruleName: string, options: ParseOptions) {
        super(sourceFile, ruleName, options);
        this.typeChecker = typeChecker || (typeChecker = createProgram([this.sourceFile.fileName], {
            noEmitOnError: true,
            noImplicitAny: true,
            target: ScriptTarget.Latest,
            module: ModuleKind.CommonJS,
        }).getTypeChecker());
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

    private getReturnType(
        node: ReturnTypeRelatedFunctionLikeDeclaration,
    ): string | undefined {
        let type = this.typeChecker.typeToString(
            this.typeChecker.getTypeAtLocation(node).getCallSignatures()[0].getReturnType(),
        );

        if (!this.options.complexTypeFixer && !BASE_TYPES.some(v => v === type)) {
            return undefined
        }

        try {
            return type
        } catch (e) {
            return undefined;
        }
    }

    private buildFixer(
        node: ReturnTypeRelatedFunctionLikeDeclaration,
    ): Replacement | undefined {
        function typeFactory(type: string): string {
            return `: ${type} `;
        }

        let body = node.body;
        let returnType = this.getReturnType(node)

        return body && returnType
            ? new Replacement(
                node.getChildren().find(v => v.getText() === ")")!.getEnd(),
                0,
                typeFactory(returnType),
            )
            : undefined;
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
