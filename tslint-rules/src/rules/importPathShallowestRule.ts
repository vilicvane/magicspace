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
import {LiteralExpression, SourceFile} from 'typescript';

import {
  FailureManager,
  MODULE_EXTENSIONS,
  ModuleSpecifierHelper,
  gentleStat,
  getModuleSpecifier,
  isSubPathOf,
} from '../utils';

const ERROR_MESSAGE_CAN_NOT_IMPORT_DIRECTORY_MODULES =
  'Can not import this module that have index file in the directory where this module is located.';

interface ParsedOptions {
  baseUrl?: string;
  tsConfigSearchName?: string;
}

export class Rule extends Rules.AbstractRule {
  private parsedOptions: ParsedOptions;

  constructor(options: IOptions) {
    super(options);

    this.parsedOptions = options.ruleArguments[0] || {};
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
    optionsDescription:
      'You can config baseUrl for check import path in baseUrl',
    options: {
      properties: {
        baseUrl: {
          type: 'string',
        },
        tsConfigSearchName: {
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

  private moduleSpecifierHelper = new ModuleSpecifierHelper(
    this.sourceFile.fileName,
    this.options,
  );

  walk(): void {
    let imports = findImports(this.sourceFile, ImportKind.AllImports);

    for (let expression of imports) {
      this.validate(expression);
    }
  }

  private validate(expression: LiteralExpression): void {
    let helper = this.moduleSpecifierHelper;
    let specifier = getModuleSpecifier(expression);

    let {category, path} = helper.resolveWithCategory(specifier);

    let sourceFileName = this.sourceFile.fileName;

    if (
      !path ||
      category === 'built-in' ||
      category === 'node-modules' ||
      // '../..', '../../foo'
      isSubPathOf(sourceFileName, Path.dirname(path)) ||
      // './foo'
      Path.relative(path, Path.dirname(sourceFileName)) === ''
    ) {
      return;
    }

    let parentDir = Path.dirname(path);

    if (hasIndexFile(parentDir)) {
      this.failureManager.append({
        node: expression.parent,
        message: ERROR_MESSAGE_CAN_NOT_IMPORT_DIRECTORY_MODULES,
      });
    }
  }
}

function hasIndexFile(dir: string): boolean {
  let possibleIndexPaths = MODULE_EXTENSIONS.map(extension =>
    Path.join(dir, `index${extension}`),
  );

  return possibleIndexPaths.some(path => {
    let stats = gentleStat(path);
    return !!stats && stats.isFile();
  });
}
