import * as FS from 'fs';
import * as Path from 'path';

import * as _ from 'lodash';
import {
  AbstractWalker,
  IOptions,
  IRuleMetadata,
  Replacement,
  RuleFailure,
  Rules,
} from 'tslint';
import * as TypeScript from 'typescript';
import {ImportKind, findImports} from '../../../node_modules/tsutils';

import {FailureManager} from '../utils/failure-manager';
import {removeModuleFileExtension, removeQuotes} from '../utils/path';

const PARENT_DIRNAME = /^(?:\.{2})/;
const RELATIVE_PATH = /^(?:\.{1,2}[\\/])+/;
const ERROR_MESSAGE_IMPORT_OUT_OF_BASEURL =
  'This import path must use baseUrl.';
const ERROR_MESSAGE_IMPORT_IN_BASEURL =
  'This import path must be a relative path.';

interface RuleOptions {
  baseUrl: string;
}

export class Rule extends Rules.AbstractRule {
  private parsedOptions: RuleOptions;

  constructor(options: IOptions) {
    super(options);

    this.parsedOptions = options.ruleArguments[0];
  }

  apply(sourceFile: TypeScript.SourceFile): RuleFailure[] {
    return this.applyWithWalker(
      new ImportPathConventionWalker(
        sourceFile,
        Rule.metadata.ruleName,
        this.parsedOptions,
      ),
    );
  }

  static metadata: IRuleMetadata = {
    ruleName: 'import-path-convention',
    description: 'Check import module from baseUrl',
    optionsDescription: '',
    options: {
      properties: {
        baseUrl: {
          type: 'string',
        },
      },
    },
    type: 'maintainability',
    hasFix: true,
    typescriptOnly: false,
  };
}

export class ImportPathConventionWalker extends AbstractWalker<RuleOptions> {
  private sourceDirname: string;
  private importExpressions: TypeScript.Expression[] = [];
  private failureManager = new FailureManager(this);

  constructor(
    sourceFile: TypeScript.SourceFile,
    ruleName: string,
    options: RuleOptions,
  ) {
    super(sourceFile, ruleName, options);
    this.sourceDirname = Path.dirname(sourceFile.fileName);
  }

  walk(sourceFile: TypeScript.SourceFile): void {
    for (const expression of findImports(
      sourceFile,
      ImportKind.AllStaticImports,
    )) {
      this.importExpressions.push(expression);
    }

    this.validate();
  }

  private validate(): void {
    let importExpressions = this.importExpressions;

    for (let expression of importExpressions) {
      let text = removeQuotes(expression.getText());
      if (
        !this.isModuleInbaseUrl(this.sourceDirname) &&
        this.isModuleInbaseUrl(text) &&
        RELATIVE_PATH.test(text)
      ) {
        // sourceFile 不在 baseUrl 目录下， 且模块用的是相对路径
        this.sourceFileOutOfBaseUrl(expression, text);
      } else if (
        this.isModuleInbaseUrl(this.sourceDirname) &&
        this.isModuleInbaseUrl(text) &&
        !RELATIVE_PATH.test(text)
      ) {
        // sourceFile 在 baseUrl 目录下， 且模块没有用相对路径
        this.sourceFileInBaseUrl(expression, text);
      }

      this.failureManager.throw();
    }
  }

  private sourceFileInBaseUrl(
    expression: TypeScript.Expression,
    text: string,
  ): void {
    let importPath = Path.relative(
      this.sourceDirname,
      Path.join(this.getBaseUrl(), text),
    );

    if (!PARENT_DIRNAME.test(importPath)) {
      importPath = `./${importPath}`;
    }

    this.failureManager.append({
      message: ERROR_MESSAGE_IMPORT_OUT_OF_BASEURL,
      node: expression.parent!,
      fixer: new Replacement(
        expression.getStart(),
        expression.getWidth(),
        `'${importPath}'`,
      ),
    });
  }

  private sourceFileOutOfBaseUrl(
    expression: TypeScript.Expression,
    text: string,
  ): void {
    let importPath = Path.relative(
      this.getBaseUrl(),
      Path.join(this.sourceDirname, text),
    );

    this.failureManager.append({
      message: ERROR_MESSAGE_IMPORT_IN_BASEURL,
      node: expression.parent!,
      fixer: new Replacement(
        expression.getStart(),
        expression.getWidth(),
        `'${importPath}'`,
      ),
    });
  }

  private getBaseUrl(): string {
    let rootPath = findProjectRootPath(this.sourceDirname);

    if (!rootPath) {
      throw new Error('can not find tslint.json');
    }

    return Path.join(rootPath, this.options.baseUrl);
  }

  private isModuleInbaseUrl(filePath: string): boolean {
    if (RELATIVE_PATH.test(filePath) || Path.isAbsolute(filePath)) {
      return this.isFileInDirectory(filePath, this.getBaseUrl());
    }

    filePath = Path.join(this.getBaseUrl(), filePath);
    let basename = removeModuleFileExtension(Path.basename(filePath));
    let dirname = Path.dirname(filePath);
    let files = FS.readdirSync(dirname).map(file =>
      removeModuleFileExtension(file),
    );

    if (_.includes(files, basename)) {
      return true;
    }
    return false;
  }

  private isFileInDirectory(filePath: string, directoryPath: string): boolean {
    let modulePath = filePath;

    if (!Path.isAbsolute(filePath)) {
      modulePath = Path.join(this.sourceDirname, filePath);
    }

    return !PARENT_DIRNAME.test(Path.relative(directoryPath, modulePath));
  }
}

let findProjectRootPath = (() => {
  let rootPathCache: string | undefined;

  return function inner(currentPath: string): string | undefined {
    if (rootPathCache) {
      return rootPathCache;
    }

    try {
      let files = FS.readdirSync(currentPath);

      if (_.includes(files, 'tslint.json')) {
        rootPathCache = currentPath;
        return currentPath;
      } else {
        return inner(Path.join(currentPath, '..'));
      }
    } catch (e) {
      return undefined;
    }
  };
})();
