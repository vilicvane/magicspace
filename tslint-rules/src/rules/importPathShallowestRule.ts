import * as FS from 'fs';
import * as Path from 'path';
import POSIXPath = Path.posix;

import * as _ from 'lodash';
import {
  AbstractWalker,
  IOptions,
  IRuleMetadata,
  RuleFailure,
  Rules,
} from 'tslint';
import {ImportKind, findImports} from 'tsutils';
import {LiteralExpression, SourceFile} from 'typescript';

import {FailureManager} from '../utils/failure-manager';
import {matchNodeCore, matchNodeModules} from '../utils/match';
import {
  getInBaseURLOfModulePath,
  removeModuleFileExtension,
  removeQuotes,
} from '../utils/path';

const ERROR_MESSAGE_CAN_NOT_IMPORT_DIRECTORY_MODULES =
  'Can not import this module that have index file in the directory where this module is located.';

interface ParsedOptions {
  baseUrl: string;
  baseUrlDirSearchName: string;
}

export class Rule extends Rules.AbstractRule {
  private parsedOptions: ParsedOptions;

  constructor(options: IOptions) {
    super(options);

    this.parsedOptions = options.ruleArguments[0];
  }

  apply(sourceFile: SourceFile): RuleFailure[] {
    return this.applyWithWalker(
      new ImportPathShallowestWalker(
        sourceFile,
        Rule.metadata.ruleName,
        this.parsedOptions,
      ),
    );
  }

  static metadata: IRuleMetadata = {
    ruleName: 'import-path-shallowest',
    description:
      'Validate import expression of path that directory module path whether module under the path or not',
    optionsDescription: '',
    options: {
      properties: {
        baseUrl: {
          type: 'string',
        },
        baseUrlDirSearchName: {
          type: 'string',
        },
      },
    },
    type: 'maintainability',
    hasFix: true,
    typescriptOnly: false,
  };
}

class ImportPathShallowestWalker extends AbstractWalker<ParsedOptions> {
  private failureManager = new FailureManager(this);

  walk(sourceFile: SourceFile): void {
    this.forEachImportExpression(sourceFile);
  }

  private validate(
    sourceFile: SourceFile,
    expression: LiteralExpression,
  ): void {
    let modulePath = removeQuotes(expression.getText());

    if (
      matchNodeModules(modulePath, sourceFile.fileName) ||
      matchNodeCore(modulePath) ||
      this.isDirectParentModule(modulePath) ||
      this.isCurrentModule(modulePath)
    ) {
      return;
    }

    if (this.options && this.options.baseUrl) {
      if (this.options) {
        let {ok, parsedModulePath} = getInBaseURLOfModulePath(
          modulePath,
          this.options.baseUrl,
          this.sourceFile.fileName,
          this.options.baseUrlDirSearchName || 'tsconfig.json',
        );

        if (ok) {
          modulePath = parsedModulePath;
        }
      }
    }

    let basePath = Path.dirname(modulePath);

    if (Path.isAbsolute(basePath)) {
      basePath = POSIXPath.relative(
        Path.dirname(sourceFile.fileName),
        basePath,
      );
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
        POSIXPath.join(Path.dirname(sourceFile.fileName), basePath),
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

  private isDirectParentModule(modulePath: string): boolean {
    return /^(?:\.{2}\/((?:\.{2})\/)*[^\/]+|\.{1}\/((?:\.{2})\/)+[^\/]+)$/.test(
      modulePath,
    );
  }

  private isCurrentModule(modulePath: string): boolean {
    return /^\.{1}\/[^\/]+$/.test(modulePath);
  }
}
