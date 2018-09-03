import * as Path from 'path';

import {
  AbstractWalker,
  IRuleMetadata,
  Replacement,
  RuleFailure,
  Rules,
} from 'tslint';
import {ImportKind, findImports} from 'tsutils';
import {LiteralExpression, SourceFile} from 'typescript';

import {FailureManager} from '../utils/failure-manager';
import {matchNodeCore, matchNodeModules} from '../utils/match';
import {removeQuotes} from '../utils/path';

const RELATIVE_PATH_REGEX = /^(?:\.{1,2}[\\/])+/;
const UPPER_RELATIVE_PATH_REGEX = /^\.\.\//;
const ERROR_MESSAGE_NONSTANDARD_IMPORT_PATH =
  'The import path could be smarter.';

export class Rule extends Rules.AbstractRule {
  apply(sourceFile: SourceFile): RuleFailure[] {
    return this.applyWithWalker(
      new ImportPathBeSmartWalker(
        sourceFile,
        Rule.metadata.ruleName,
        undefined,
      ),
    );
  }

  static metadata: IRuleMetadata = {
    ruleName: 'import-path-be-smart',
    description: 'Check to if import path is a shortest path and provide fixer',
    optionsDescription: '',
    options: undefined,
    type: 'maintainability',
    hasFix: true,
    typescriptOnly: false,
  };
}

class ImportPathBeSmartWalker extends AbstractWalker<undefined> {
  private failureManager = new FailureManager<undefined>(this);

  walk(sourceFile: SourceFile): void {
    this.forEachImportExpression(sourceFile);
  }

  private forEachImportExpression(sourceFile: SourceFile): void {
    for (let expression of findImports(
      sourceFile,
      ImportKind.AllStaticImports,
    )) {
      let importPath = removeQuotes(expression.getText());

      if (matchNodeCore(importPath)) {
        continue;
      } else if (RELATIVE_PATH_REGEX.test(importPath)) {
        this.checkImportPath(sourceFile, expression);
        this.checkNodeModuleImportPath(sourceFile, expression);
      }
    }
  }

  private checkImportPath(
    sourceFile: SourceFile,
    expression: LiteralExpression,
  ): void {
    let importPath = removeQuotes(expression.getText());

    if (Path.isAbsolute(importPath)) {
      return;
    }

    let sourceFilePath = Path.dirname(sourceFile.fileName);

    let absoluteImportPath = Path.join(sourceFilePath, importPath);
    let relativePath = Path.relative(sourceFilePath, absoluteImportPath)
      .split(Path.sep)
      .join('/');

    if (!UPPER_RELATIVE_PATH_REGEX.test(relativePath)) {
      relativePath = `./${relativePath}`;
    }

    if (importPath !== relativePath) {
      this.failureManager.append({
        node: expression,
        message: ERROR_MESSAGE_NONSTANDARD_IMPORT_PATH,
        replacement: new Replacement(
          expression.getStart(),
          expression.getWidth(),
          this.buildFixer(relativePath),
        ),
      });
    }
  }

  private checkNodeModuleImportPath(
    sourceFile: SourceFile,
    expression: LiteralExpression,
  ): void {
    let importPath = removeQuotes(expression.getText());
    let targetPath: string[] = [];

    let checkNodeModulesImportPath = (path: string): void => {
      let pathParts = path.split('/');
      let baseName = pathParts.pop()!;

      if (matchNodeModules(path, sourceFile.fileName)) {
        targetPath.push(baseName);
        return;
      } else if (pathParts.length !== 1) {
        checkNodeModulesImportPath(pathParts.join('/'));
      }

      return;
    };

    checkNodeModulesImportPath(importPath);

    if (targetPath.length) {
      this.failureManager.append({
        node: expression.parent,
        message: ERROR_MESSAGE_NONSTANDARD_IMPORT_PATH,
        replacement: new Replacement(
          expression.getStart(),
          expression.getWidth(),
          this.buildFixer(targetPath.join('/')),
        ),
      });
    }
  }

  private buildFixer(replacementStr: string): string {
    return `'${replacementStr}'`;
  }
}
