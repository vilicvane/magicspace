import {
  AST_NODE_TYPES,
  TSESLint,
  TSESTree,
} from '@typescript-eslint/experimental-utils';
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

  // eslint-disable-next-line no-cond-assign
  while ((parent = parent.parent)) {
    if (isFunctionLikeDeclaration(parent)) {
      return parent;
    }
  }

  return undefined;
}

function isDeclarationFile(
  context: TSESLint.RuleContext<string, unknown[]>,
): boolean {
  return /\.d\.ts$/.test(context.getFilename());
}

export type TextualLiteral =
  | (TSESTree.Literal & {value: string})
  | (TSESTree.TemplateLiteral & {quasis: {length: 1}});

export function isTextualLiteral(node: TSESTree.Node): node is TextualLiteral {
  return (
    (node.type === AST_NODE_TYPES.Literal && typeof node.value === 'string') ||
    (node.type === AST_NODE_TYPES.TemplateLiteral && node.quasis.length === 1)
  );
}

export function getFullStart(
  sourceCode: TSESLint.SourceCode,
  node: TSESTree.Node,
): number {
  let token = sourceCode.getTokenBefore(node);

  // eslint-disable-next-line no-null/no-null
  return token === null ? 0 : token.range[1];
}

// type AssertNever<T extends never> = T;

/* eslint-disable no-bitwise */

export const enum ImportKind {
  ImportDeclaration = 1,
  ImportEquals = 2,
  ExportFrom = 4,
  DynamicImport = 8,
  Require = 16,
  ImportType = 32,
  All = ImportDeclaration |
    ImportEquals |
    ExportFrom |
    DynamicImport |
    Require |
    ImportType,
  AllImports = ImportDeclaration |
    ImportEquals |
    DynamicImport |
    Require |
    ImportType,
  AllStaticImports = ImportDeclaration | ImportEquals,
  AllImportExpressions = DynamicImport | Require,
  AllRequireLike = ImportEquals | Require,
  // @internal
  AllNestedImports = AllImportExpressions | ImportType,
  // @internal
  AllTopLevelImports = AllStaticImports | ExportFrom,
}

export function findImports(
  context: TSESLint.RuleContext<string, unknown[]>,
  kinds: ImportKind,
): TextualLiteral[] {
  const result: TextualLiteral[] = [];

  for (let node of findImportLikeNodes(context, kinds)) {
    switch (node.type) {
      case AST_NODE_TYPES.ImportDeclaration:
        addIfTextualLiteral(node.source);
        break;

      case AST_NODE_TYPES.TSImportEqualsDeclaration:
        if (
          node.moduleReference.type === AST_NODE_TYPES.TSExternalModuleReference
        ) {
          addIfTextualLiteral(node.moduleReference.expression);
        } else {
          throw new Error('Unexpected node');
        }

        break;

      case AST_NODE_TYPES.ExportNamedDeclaration:
      case AST_NODE_TYPES.ExportAllDeclaration:
        addIfTextualLiteral(node.source);
        break;

      case AST_NODE_TYPES.CallExpression:
        addIfTextualLiteral(node.arguments[0]);
        break;

      case AST_NODE_TYPES.TSImportType:
        if (node.parameter.type === AST_NODE_TYPES.TSLiteralType) {
          addIfTextualLiteral(node.parameter.literal);
        }

        break;

      default:
        throw new Error('Unexpected node');
    }
  }

  return result;

  function addIfTextualLiteral(node: TSESTree.Expression): void {
    if (isTextualLiteral(node)) {
      result.push(node); // TODO: 这里的node有重复加
    }
  }
}

type ImportLike =
  | TSESTree.ImportDeclaration
  | (TSESTree.TSImportEqualsDeclaration & {
      moduleReference: TSESTree.TSExternalModuleReference;
    })
  | ((TSESTree.ExportNamedDeclaration | TSESTree.ExportAllDeclaration) & {
      source: {};
    })
  | (TSESTree.CallExpression & {
      callee: TSESTree.Import | (TSESTree.Identifier & {name: 'require'});
      arguments: [TSESTree.Expression];
    })
  | TSESTree.TSImportType;

function findImportLikeNodes(
  context: TSESLint.RuleContext<string, unknown[]>,
  kinds: ImportKind,
): ImportLike[] {
  return new ImportFinder(context, kinds).find();
}

class ImportFinder {
  private _result: ImportLike[] = [];

  constructor(
    private _context: TSESLint.RuleContext<string, unknown[]>,
    private _options: ImportKind,
  ) {}

  find(): ImportLike[] {
    if (isDeclarationFile(this._context)) {
      this._options &= ~ImportKind.AllImportExpressions;
    }

    if (this._options & ImportKind.AllTopLevelImports) {
      this._findImports(this._context.getSourceCode().ast.body);
    }

    if (this._options & ImportKind.AllNestedImports) {
      this._findNestedImports();
    }

    return this._result;
  }

  private _findImports(statements: readonly TSESTree.Statement[]): void {
    for (const statement of statements) {
      if (statement.type === AST_NODE_TYPES.ImportDeclaration) {
        if (this._options & ImportKind.ImportDeclaration) {
          this._result.push(statement);
        }
      } else if (statement.type === AST_NODE_TYPES.TSImportEqualsDeclaration) {
        if (
          this._options & ImportKind.ImportEquals &&
          statement.moduleReference.type ===
            AST_NODE_TYPES.TSExternalModuleReference
        ) {
          this._result.push(statement as any);
        }
      } else if (
        statement.type === AST_NODE_TYPES.ExportNamedDeclaration ||
        statement.type === AST_NODE_TYPES.ExportAllDeclaration
      ) {
        if (
          statement.source !== undefined && // TODO: 有必要判断是否为undefined吗？
          this._options & ImportKind.ExportFrom
        ) {
          this._result.push(statement as any);
        }
      } else if (statement.type === AST_NODE_TYPES.TSModuleDeclaration) {
        this._findImportsInModule(statement);
      }
    }
  }

  private _findImportsInModule(
    declaration: TSESTree.TSModuleDeclaration,
  ): void {
    if (declaration.body === undefined) {
      return;
    }

    if (declaration.body.type === AST_NODE_TYPES.TSModuleDeclaration) {
      this._findImportsInModule(declaration.body);
      return;
    }

    this._findImports(declaration.body.body);
  }

  private _findNestedImports(): void {
    let re;

    if ((this._options & ImportKind.AllNestedImports) === ImportKind.Require) {
      re = /\brequire\s*[</(]/g;
    } else if (this._options & ImportKind.Require) {
      re = /\b(?:import|require)\s*[</(]/g;
    } else {
      re = /\bimport\s*[</(]/g;
    }

    // const isJavaScriptFile = /\.js$/.test(this._context.getFilename());

    for (
      let match = re.exec(this._context.getSourceCode().getText());
      // eslint-disable-next-line no-null/no-null
      match !== null;
      match = re.exec(this._context.getSourceCode().getText())
    ) {
      const token = this._context.getSourceCode().getNodeByRangeIndex(
        match.index,
        // // only look for ImportTypeNode within JSDoc in JS files
        // match[0][0] === 'i' && isJavaScriptFile,  // TODO: How to handle JSDoc?
      )!;

      if (token.type === AST_NODE_TYPES.Import) {
        if (token.range[1] - 'import'.length !== match.index) {
          continue;
        }

        switch (token.parent!.type) {
          case AST_NODE_TYPES.TSImportType:
            this._result.push(token.parent as TSESTree.TSImportType);
            break;
          case AST_NODE_TYPES.CallExpression:
            if (
              (token.parent as TSESTree.CallExpression).arguments.length === 1
            ) {
              this._result.push(token.parent as any);
            }

            break;
        }
      } else if (
        token.type === AST_NODE_TYPES.Identifier &&
        token.range[1] - 'require'.length === match.index &&
        token.parent!.type === AST_NODE_TYPES.CallExpression &&
        (token.parent as TSESTree.CallExpression).callee === token &&
        (token.parent as TSESTree.CallExpression).arguments.length === 1
      ) {
        this._result.push(token.parent as any);
      }
    }
  }
}
