import * as FS from 'fs';
import * as Path from 'path';

import * as _ from 'lodash';
import {AbstractWalker, IRuleMetadata, RuleFailure, Rules} from 'tslint';
import {ImportKind, findImports} from 'tsutils';
import {LiteralExpression, SourceFile} from 'typescript';

import {FailureManager} from '../utils/failure-manager';
import {removeModuleFileExtension, removeQuotes} from '../utils/path';

const ERROR_MESSAGE_CAN_NOT_IMPORT_DIRECTORY_MODULES =
  'Can not import this module that have index file in the directory where this module is located.';

export class Rule extends Rules.AbstractRule {
  apply(sourceFile: SourceFile): RuleFailure[] {
    return this.applyWithWalker(
      new ImportPathShallowestWalker(
        sourceFile,
        Rule.metadata.ruleName,
        undefined,
      ),
    );
  }

  static metadata: IRuleMetadata = {
    ruleName: 'import-path-shallowest',
    description:
      'Validate import expression of path that directory module path whether module under the path or not',
    optionsDescription: '',
    options: undefined,
    type: 'maintainability',
    hasFix: true,
    typescriptOnly: false,
  };
}

class ImportPathShallowestWalker extends AbstractWalker<undefined> {
  private failureManager = new FailureManager(this);

  walk(sourceFile: SourceFile): void {
    this.forEachImportExpression(sourceFile);
  }

  private validate(
    sourceFile: SourceFile,
    expression: LiteralExpression,
  ): void {
    let basePath = Path.dirname(removeQuotes(expression.getText()));

    if (Path.isAbsolute(basePath)) {
      basePath = Path.relative(Path.dirname(sourceFile.fileName), basePath);
    }

    if (this.validateIsDirectoryModule(sourceFile, basePath)) {
      this.failureManager.append({
        node: expression.parent,
        message: ERROR_MESSAGE_CAN_NOT_IMPORT_DIRECTORY_MODULES,
      });
    }
  }

  private isIndexFile(pathname: string): boolean {
    let extName = Path.extname(pathname);
    let baseName = removeModuleFileExtension(Path.basename(pathname));
    // console.log(extName, baseName);
    return baseName === 'index' && /\.(ts|js)$/.test(extName);
  }

  private validateIsDirectoryModule(
    sourceFile: SourceFile,
    basePath: string,
  ): boolean {
    let files: string[];

    if (basePath === '') {
      return false;
    }

    try {
      files = FS.readdirSync(
        Path.join(Path.dirname(sourceFile.fileName), basePath),
      );
    } catch (e) {
      return false;
    }

    // 引入的模块的目录是否为一个目录模块
    if (files.some(file => this.isIndexFile(file))) {
      return true;
    } else {
      let nextBasePath = basePath.split('/');

      if (nextBasePath.length === 1) {
        return false;
      }

      return this.validateIsDirectoryModule(sourceFile, nextBasePath.shift()!);
    }
  }

  private forEachImportExpression(sourceFile: SourceFile): void {
    for (let expression of findImports(sourceFile, ImportKind.AllImports)) {
      this.validate(sourceFile, expression);
    }
  }
}
