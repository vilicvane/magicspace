import * as FS from 'fs';
import * as Path from 'path';

import * as _ from 'lodash';
import {
  AbstractWalker,
  IOptions,
  IRuleMetadata,
  RuleFailure,
  Rules,
} from 'tslint';
import {ImportKind, findImports} from 'tsutils';
import * as TypeScript from 'typescript';

import {removeQuotes} from '../utils/path';

interface RuleOptions {
  baseUrl: string;
  rules: {[dirName: string]: string[]};
}

const ERROR_MESSAGE_BANNED_HIERARCHY_IMPORT =
  'cannot import this module according to the tslint config';

export class Rule extends Rules.AbstractRule {
  private parsedOptions: RuleOptions;

  constructor(options: IOptions) {
    super(options);
    this.parsedOptions = options.ruleArguments[0];
  }

  apply(sourceFile: TypeScript.SourceFile): RuleFailure[] {
    return this.applyWithWalker(
      new ImportPathStrictHierarchyWalker(
        sourceFile,
        Rule.metadata.ruleName,
        this.parsedOptions,
      ),
    );
  }

  static metadata: IRuleMetadata = {
    ruleName: 'import-path-strict-hierarchy',
    description: '',
    optionsDescription: '',
    options: {
      // to update
      properties: {
        ['string']: 'array',
      },
    },
    type: 'maintainability',
    hasFix: true,
    typescriptOnly: false,
  };
}

class ImportPathStrictHierarchyWalker extends AbstractWalker<RuleOptions> {
  private importExpressions: TypeScript.Expression[] = [];
  private sourceDirname: string;

  constructor(
    sourceFile: TypeScript.SourceFile,
    ruleName: string,
    options: RuleOptions,
  ) {
    super(sourceFile, ruleName, options);
    this.sourceDirname = Path.dirname(sourceFile.fileName);

    if (!this.options || !this.options.baseUrl) {
      throw new Error('Option baseUrl is required');
    }
  }

  walk(sourceFile: TypeScript.SourceFile): void {
    for (let expression of findImports(sourceFile, ImportKind.AllImports)) {
      this.importExpressions.push(expression);
    }

    this.validate();
  }

  pathInRule(path: string): any {
    return Path.relative(this.getBaseUrl(), path).split(Path.sep)[0];
  }

  private checkPath(
    currentPath: string,
    importPath: string,
    first = true,
  ): boolean {
    if (first) {
      currentPath = this.pathInRule(currentPath);
      importPath = this.pathInRule(importPath);
    }

    if (this.options.rules[currentPath]) {
      if (
        currentPath === importPath ||
        this.options.rules[currentPath].includes(importPath)
      ) {
        return true;
      }

      for (const subDir of this.options.rules[currentPath]) {
        if (this.checkPath(subDir, importPath, false)) {
          return true;
        }
      }

      return false;
    } else {
      return first;
    }
  }

  private getBaseUrl(): string {
    let rootPath = findProjectRootPath(this.sourceDirname);

    if (!rootPath) {
      throw new Error('can not find tslint.json');
    }

    return Path.join(rootPath, this.options.baseUrl);
  }

  private validate(): void {
    const {importExpressions} = this;
    const currentDir = Path.dirname(this.sourceFile.fileName);
    importExpressions.forEach(expression => {
      const importPath = Path.join(
        currentDir,
        removeQuotes(expression.getText()),
      );

      if (!this.checkPath(currentDir, importPath)) {
        this.addFailureAtNode(
          expression.parent,
          ERROR_MESSAGE_BANNED_HIERARCHY_IMPORT,
        );
      }
    });
  }
}

let findProjectRootPath = ((): ((
  currentPath: string,
  baseUrlDirSearchName?: string,
) => string | undefined) => {
  let rootPathCache: string | undefined;

  return function inner(
    currentPath: string,
    baseUrlDirSearchName = 'tslint.json',
  ): string | undefined {
    if (rootPathCache) {
      return rootPathCache;
    }

    try {
      let files = FS.readdirSync(currentPath);

      if (_.includes(files, baseUrlDirSearchName)) {
        rootPathCache = currentPath;
        return currentPath;
      } else {
        return inner(Path.join(currentPath, '..'), baseUrlDirSearchName);
      }
    } catch (e) {
      throw new Error(
        `can not find such 'baseUrlDirSearchName' that ${baseUrlDirSearchName}`,
      );
    }
  };
})();
