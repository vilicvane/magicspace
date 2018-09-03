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
import {ImportKind, findImports} from 'tsutils';
import * as TypeScript from 'typescript';

import {FailureManager} from '../utils/failure-manager';
import {
  hasKnownModuleExtension,
  removeModuleFileExtension,
  removeQuotes,
} from '../utils/path';

const RELATIVE_PATH_REGEX = /^(?:\.{1,2}[\\/])+/;
const PATH_PART_REGEX = /[^\\/]+/;

const ERROR_MESSAGE_IMPORT_MUST_USE_BASE_URL =
  'This import path must use baseUrl.';
const ERROR_MESSAGE_IMPORT_MUST_BE_RELATIVE_PATH =
  'This import path must be a relative path.';
const ERROR_MESSAGE_IMPORT_OUT_OF_BASE_URL_DIR =
  'Import path is not in directory configured by baseUrl';

interface RuleOptions {
  baseUrl: string;
  baseUrlDirSearchName: string | undefined;
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

  apply(sourceFile: TypeScript.SourceFile): RuleFailure[] {
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
        baseUrlDirSearchName: {
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
  private sourceDir: string;
  private baseUrlDir: string;
  private baseUrlNameSet: Set<string>;

  private imports: TypeScript.LiteralExpression[] = [];
  private failureManager = new FailureManager(this);

  constructor(
    sourceFile: TypeScript.SourceFile,
    ruleName: string,
    options: RuleOptions,
  ) {
    super(sourceFile, ruleName, options);

    this.sourceDir = Path.dirname(sourceFile.fileName);

    let baseUrlDir = (this.baseUrlDir = searchBaseUrlDir(
      this.sourceDir,
      options.baseUrlDirSearchName || 'tsconfig.json',
    ));

    let baseUrlNames = FS.readdirSync(baseUrlDir).reduce(
      (names, entryName) => {
        let entryPath = Path.join(baseUrlDir, entryName);

        if (FS.statSync(entryPath).isDirectory()) {
          return [...names, entryName];
        } else if (hasKnownModuleExtension(entryName)) {
          return [...names, entryName, removeModuleFileExtension(entryName)];
        }

        return names;
      },
      [] as string[],
    );

    this.baseUrlNameSet = new Set(baseUrlNames);
  }

  walk(sourceFile: TypeScript.SourceFile): void {
    let imports = findImports(sourceFile, ImportKind.AllStaticImports);

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

  private validateModuleSpecifier(
    expression: TypeScript.LiteralExpression,
  ): void {
    let sourceDir = this.sourceDir;
    let baseUrlDir = this.baseUrlDir;

    let specifier = removeQuotes(expression.getText());
    let relative = RELATIVE_PATH_REGEX.test(specifier);

    let fullSpecifierPath: string;

    if (relative) {
      fullSpecifierPath = Path.join(sourceDir, specifier);
    } else {
      let specifierFirstPart = PATH_PART_REGEX.exec(specifier)![0];

      if (!this.baseUrlNameSet.has(specifierFirstPart)) {
        return;
      }

      fullSpecifierPath = Path.join(baseUrlDir, specifier);
    }

    let relativeSourceDir = Path.relative(baseUrlDir, sourceDir);

    let relativeSourceDirFirstPart =
      relativeSourceDir && PATH_PART_REGEX.exec(relativeSourceDir)![0];

    // sourceDir 在 baseUrlDir 以外.
    if (relativeSourceDirFirstPart === '..') {
      return;
    }

    let relativeSpecifierPath = Path.relative(baseUrlDir, fullSpecifierPath);

    let relativeSpecifierPathFirstPart =
      relativeSpecifierPath && PATH_PART_REGEX.exec(relativeSpecifierPath)![0];

    // specifier 在 baseUrlDir 以外.
    if (relativeSpecifierPathFirstPart === '..') {
      this.failureManager.append({
        message: ERROR_MESSAGE_IMPORT_OUT_OF_BASE_URL_DIR,
        node: expression,
      });
      return;
    }

    if (relativeSourceDirFirstPart === relativeSpecifierPathFirstPart) {
      if (!relative) {
        let relativeSpecifier = `'${formatModulePath(
          Path.relative(sourceDir, fullSpecifierPath),
          true,
        )}'`;

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
        let baseUrlSpecifier = `'${formatModulePath(
          Path.relative(baseUrlDir, fullSpecifierPath),
          false,
        )}'`;

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

function searchBaseUrlDir(from: string, searchName: string): string {
  let nextDir = from;

  while (true) {
    let currentDir = nextDir;

    let searchPath = Path.join(currentDir, searchName);

    if (FS.existsSync(searchPath)) {
      return currentDir;
    }

    nextDir = Path.dirname(currentDir);

    if (nextDir === currentDir) {
      throw new Error(
        `Cannot find base url directory by search name "${searchName}"`,
      );
    }
  }
}

function formatModulePath(path: string, relative: boolean): string {
  path = removeModuleFileExtension(path).replace(/\\/g, '/');

  if (relative && !RELATIVE_PATH_REGEX.test(path)) {
    path = `./${path}`;
  }

  return path;
}
