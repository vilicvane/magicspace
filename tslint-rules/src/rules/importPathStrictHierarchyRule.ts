import * as Path from 'path';

import * as _ from 'lodash';
import {Dict} from 'tslang';
import {
  AbstractWalker,
  IOptions,
  IRuleMetadata,
  RuleFailure,
  Rules,
} from 'tslint';
import {ImportKind, findImports} from 'tsutils';
import {Expression, SourceFile} from 'typescript';

import {
  getBaseNameWithoutExtension,
  removeQuotes,
  searchProjectRootDir,
} from '../utils/path';

interface RuleOptions {
  baseUrl: string;
  searchName: string;
  rules: Dict<string[] | undefined>;
}

const ERROR_MESSAGE_BANNED_HIERARCHY_IMPORT =
  'Cannot import this module according to the tslint config';

export class Rule extends Rules.AbstractRule {
  private parsedOptions: RuleOptions;

  constructor(options: IOptions) {
    super(options);
    this.parsedOptions = options.ruleArguments[0];

    if (!this.parsedOptions || !this.parsedOptions.baseUrl) {
      throw new Error('Option baseUrl is required');
    }
  }

  apply(sourceFile: SourceFile): RuleFailure[] {
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
      properties: {
        baseUrl: {
          type: 'string',
        },
        searchName: {
          type: 'string',
        },
        rules: {
          additionalProperties: {
            items: {
              type: 'string',
            },
            type: 'array',
          },
          type: 'object',
        },
      },
      type: 'object',
    },
    type: 'maintainability',
    hasFix: false,
    typescriptOnly: false,
  };
}

class ImportPathStrictHierarchyWalker extends AbstractWalker<RuleOptions> {
  private importExpressions: Expression[] = [];

  private sourceDir: string;
  private baseUrlDir: string;

  constructor(sourceFile: SourceFile, ruleName: string, options: RuleOptions) {
    super(sourceFile, ruleName, options);

    this.sourceDir = Path.dirname(sourceFile.fileName);

    this.baseUrlDir = Path.join(
      searchProjectRootDir(
        this.sourceDir,
        this.options.searchName || 'tsconfig.json',
      ),
      options.baseUrl,
    );
  }

  walk(sourceFile: SourceFile): void {
    for (let expression of findImports(sourceFile, ImportKind.AllImports)) {
      this.importExpressions.push(expression);
    }

    this.validate();
  }

  getFirstPartInRelativePath(path: string): any {
    return Path.relative(this.baseUrlDir, path).split(Path.sep)[0];
  }

  private checkPath(
    specifierFirstPart: string,
    checkingFolderName: string,
    first = true,
  ): boolean {
    if (specifierFirstPart === checkingFolderName) {
      return true;
    }

    let {rules: ruleDict} = this.options;

    let allowedFolderNames = ruleDict[checkingFolderName];

    if (allowedFolderNames && specifierFirstPart !== '..') {
      if (allowedFolderNames.includes(specifierFirstPart)) {
        return true;
      }

      for (let folderName of allowedFolderNames) {
        if (this.checkPath(specifierFirstPart, folderName, false)) {
          return true;
        }
      }

      return false;
    } else {
      return first;
    }
  }

  private validate(): void {
    let currentDir = Path.dirname(this.sourceFile.fileName);
    let fileName = getBaseNameWithoutExtension(
      Path.basename(this.sourceFile.fileName),
    );
    let fakeDir = '';

    if (currentDir === this.baseUrlDir) {
      fakeDir = Path.join(currentDir, fileName);
    }

    for (let expression of this.importExpressions) {
      let importPath = Path.join(
        currentDir,
        removeQuotes(expression.getText()),
      );

      let specifierFirstPart = this.getFirstPartInRelativePath(importPath);
      let checkingFolderName = this.getFirstPartInRelativePath(
        fakeDir || currentDir,
      );

      if (!this.checkPath(specifierFirstPart, checkingFolderName)) {
        this.addFailureAtNode(
          expression.parent,
          ERROR_MESSAGE_BANNED_HIERARCHY_IMPORT,
        );
      }
    }
  }
}
