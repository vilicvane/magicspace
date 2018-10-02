import * as _ from 'lodash';
import {
  AbstractWalker,
  IOptions,
  IRuleMetadata,
  Replacement,
  RuleFailure,
  Rules,
} from 'tslint';
import {ImportKind, findImports} from 'tsutils';
import {LiteralExpression, SourceFile} from 'typescript';

import {
  FailureManager,
  ModuleSpecifierHelper,
  getFirstSegmentOfPath,
  getModuleSpecifier,
  isRelativeModuleSpecifier,
} from '../utils';

const ERROR_MESSAGE_IMPORT_MUST_USE_BASE_URL =
  'This import path must use baseUrl.';
const ERROR_MESSAGE_IMPORT_MUST_BE_RELATIVE_PATH =
  'This import path must be a relative path.';

interface RuleOptions {
  baseUrl: string;
  tsConfigSearchName: string | undefined;
}

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
      new ImportPathBaseUrlWalker(
        sourceFile,
        Rule.metadata.ruleName,
        this.parsedOptions,
      ),
    );
  }

  static metadata: IRuleMetadata = {
    ruleName: 'import-path-base-url',
    description: 'Check import module from baseUrl',
    optionsDescription: '',
    options: {
      properties: {
        baseUrl: {
          type: 'string',
        },
        tsConfigSearchName: {
          type: 'string',
          default: 'tsconfig.json',
        },
      },
    },
    type: 'maintainability',
    hasFix: true,
    typescriptOnly: false,
  };
}

export class ImportPathBaseUrlWalker extends AbstractWalker<RuleOptions> {
  private sourceFileName: string;
  private moduleSpecifierHelper: ModuleSpecifierHelper;

  private imports: LiteralExpression[] = [];
  private failureManager = new FailureManager(this);

  constructor(sourceFile: SourceFile, ruleName: string, options: RuleOptions) {
    super(sourceFile, ruleName, options);

    this.sourceFileName = sourceFile.fileName;

    this.moduleSpecifierHelper = new ModuleSpecifierHelper(
      this.sourceFileName,
      options,
    );
  }

  walk(): void {
    let imports = findImports(this.sourceFile, ImportKind.AllStaticImports);

    for (const expression of imports) {
      this.imports.push(expression);
    }

    this.validate();
  }

  private validate(): void {
    for (let expression of this.imports) {
      this.validateModuleSpecifier(expression);
    }
  }

  private validateModuleSpecifier(expression: LiteralExpression): void {
    let sourceFileName = this.sourceFileName;

    let helper = this.moduleSpecifierHelper;

    if (!helper.isPathWithinBaseUrlDir(sourceFileName)) {
      return;
    }

    let specifier = getModuleSpecifier(expression);

    let fullSpecifierPath = helper.resolve(specifier);

    if (
      !fullSpecifierPath ||
      !helper.isPathWithinBaseUrlDir(fullSpecifierPath)
    ) {
      return;
    }

    let relative = isRelativeModuleSpecifier(specifier);

    let relativeSourcePath = helper.getRelativePathToBaseUrlDir(sourceFileName);

    let firstSegmentOfRelativeSourcePath = getFirstSegmentOfPath(
      relativeSourcePath,
    );

    let relativeSpecifierPath = helper.getRelativePathToBaseUrlDir(
      fullSpecifierPath,
    );

    let firstSegmentOfSpecifierPath = getFirstSegmentOfPath(
      relativeSpecifierPath,
    );

    if (firstSegmentOfRelativeSourcePath === firstSegmentOfSpecifierPath) {
      if (!relative) {
        let relativeSpecifier = `'${helper.build(fullSpecifierPath, false)}'`;

        let replacement = new Replacement(
          expression.getStart(),
          expression.getWidth(),
          relativeSpecifier,
        );

        this.failureManager.append({
          message: ERROR_MESSAGE_IMPORT_MUST_BE_RELATIVE_PATH,
          node: expression,
          replacement,
        });
      }
    } else {
      if (relative) {
        let baseUrlSpecifier = `'${helper.build(fullSpecifierPath, true)}'`;

        let replacement = new Replacement(
          expression.getStart(),
          expression.getWidth(),
          baseUrlSpecifier,
        );

        this.failureManager.append({
          message: ERROR_MESSAGE_IMPORT_MUST_USE_BASE_URL,
          node: expression,
          replacement,
        });
      }
    }
  }
}
