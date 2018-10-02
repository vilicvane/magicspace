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
import {LiteralExpression, SourceFile} from 'typescript';

import {
  ModuleSpecifierHelper,
  ModuleSpecifierHelperOptions,
  getFirstSegmentOfPath,
  getModuleSpecifier,
  removeModuleFileExtension,
} from '../utils';

interface RuleOptions extends ModuleSpecifierHelperOptions {
  hierarchy: Dict<string[]>;
}

const ERROR_MESSAGE_BANNED_HIERARCHY_IMPORT =
  'Importing the target module from this file is not allowed';

export class Rule extends Rules.AbstractRule {
  private parsedOptions: RuleOptions;

  constructor(options: IOptions) {
    super(options);

    this.parsedOptions = options.ruleArguments[0] || {};
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
        tsConfigSearchName: {
          type: 'string',
        },
        hierarchy: {
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
  private moduleSpecifierHelper = new ModuleSpecifierHelper(
    this.sourceFile.fileName,
    this.options,
  );

  walk(): void {
    let {hierarchy} = this.options;

    let sourceNameToShallowlyAllowedNameSetMap = new Map<string, Set<string>>();

    for (let [sourceName, allowedNames] of Object.entries(hierarchy)) {
      sourceNameToShallowlyAllowedNameSetMap.set(
        sourceName,
        new Set(allowedNames),
      );
    }

    let imports = findImports(this.sourceFile, ImportKind.AllImports);

    for (let expression of imports) {
      this.validateModuleSpecifier(
        expression,
        sourceNameToShallowlyAllowedNameSetMap,
      );
    }
  }

  private validateModuleSpecifier(
    expression: LiteralExpression,
    sourceNameToAllowedNameSetMap: Map<string, Set<string>>,
  ): void {
    let helper = this.moduleSpecifierHelper;

    let specifier = getModuleSpecifier(expression);
    let {path: specifierPath, category} = helper.resolveWithCategory(specifier);

    if (
      !specifierPath ||
      (category !== 'relative' && category !== 'base-url')
    ) {
      return;
    }

    let projectDirName = helper.baseUrlDirName || helper.projectDirName;
    let sourceFileName = helper.sourceFileName;

    let specifierPathRelativeToProjectDir = Path.relative(
      projectDirName,
      specifierPath,
    );
    let sourceFileNameRelativeToProjectDir = Path.relative(
      projectDirName,
      sourceFileName,
    );

    let relativeSpecifierPathFirstSegment = getFirstSegmentOfPath(
      specifierPathRelativeToProjectDir,
    );
    let relativeSourceFileNameFirstSegment = sourceFileNameRelativeToProjectDir.includes(
      Path.sep,
    )
      ? getFirstSegmentOfPath(sourceFileNameRelativeToProjectDir)
      : removeModuleFileExtension(sourceFileNameRelativeToProjectDir);

    if (
      relativeSpecifierPathFirstSegment === '..' ||
      relativeSourceFileNameFirstSegment === '..' ||
      relativeSpecifierPathFirstSegment === relativeSourceFileNameFirstSegment
    ) {
      return;
    }

    let allowedSet = sourceNameToAllowedNameSetMap.get(
      relativeSourceFileNameFirstSegment,
    );

    if (allowedSet && !allowedSet.has(relativeSpecifierPathFirstSegment)) {
      this.addFailureAtNode(
        expression.parent,
        ERROR_MESSAGE_BANNED_HIERARCHY_IMPORT,
      );
    }
  }
}
