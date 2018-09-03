import * as FS from 'fs';
import * as Path from 'path';

import _ from 'lodash';
import {
  AbstractWalker,
  IRuleMetadata,
  Replacement,
  RuleFailure,
  Rules,
} from 'tslint';
import {isExportDeclaration, isImportDeclaration} from 'tsutils';
import {
  ExportDeclaration,
  ImportDeclaration,
  SourceFile,
  isStringLiteral,
} from 'typescript';

import {FailureManager} from '../utils/failure-manager';
import {
  getBaseNameWithoutExtension,
  hasKnownModuleExtension,
  removeModuleFileExtension,
  removeQuotes,
} from '../utils/path';

const ERROR_MESSAGE_BANNED_IMPORT =
  "This module can not be imported, because it contains internal module with prefix '@' under a parallel directory.";
const ERROR_MESSAGE_BANNED_EXPORT =
  "This module can not be exported, because it contains internal module with prefix '@' under a parallel directory.";
const ERROR_MESSAGE_MISSING_EXPORTS =
  'Missing modules expected to be exported.';

const INDEX_FILE_REGEX = /(?:^|[\\/])index\.(?:js|jsx|ts|tsx|d\.ts)$/i;

const BANNED_IMPORT_REGEX = /^(?!(?:\.{1,2}[\\/])+@(?!.*[\\/]@)).*[\\/]@/;
const BANNED_EXPORT_REGEX = /[\\/]@/;
const BANNED_EXPORT_REGEX_FOR_AT_PREFFIXED = /^\.[\\/]@(?:.*?)[\\/]@/;

export class Rule extends Rules.AbstractRule {
  apply(sourceFile: SourceFile): RuleFailure[] {
    return this.applyWithWalker(
      new ScopedModuleWalker(sourceFile, Rule.metadata.ruleName, undefined),
    );
  }

  static metadata: IRuleMetadata = {
    ruleName: 'scoped-modules',
    description: '',
    optionsDescription: '',
    options: undefined,
    type: 'maintainability',
    hasFix: true,
    typescriptOnly: false,
  };
}

type ModuleStatement = ImportDeclaration | ExportDeclaration;

type ModuleStatementInfo = ImportStatementInfo | ExportStatementInfo;
type ModuleStatementType = ModuleStatementInfo['type'];

interface ImportStatementInfo {
  type: 'import';
  statement: ModuleStatement;
  specifier: string;
}

interface ExportStatementInfo {
  type: 'export';
  statement: ModuleStatement;
  specifier: string;
}

class ScopedModuleWalker extends AbstractWalker<undefined> {
  private infos: ModuleStatementInfo[] = [];

  private failureManager = new FailureManager(this);

  walk(sourceFile: SourceFile): void {
    for (let statement of sourceFile.statements) {
      let type: ModuleStatementType;

      if (isImportDeclaration(statement)) {
        type = 'import';
      } else if (isExportDeclaration(statement)) {
        type = 'export';
      } else {
        continue;
      }

      let specifier = getModuleSpecifier(statement);

      if (!specifier) {
        continue;
      }

      this.infos.push({
        type,
        statement,
        specifier,
      } as ModuleStatementInfo);
    }

    this.validate();
  }

  private validateImportOrExport({
    type,
    statement,
    specifier,
  }: ModuleStatementInfo): void {
    let bannedPattern: RegExp;
    let message: string;

    if (type === 'import') {
      bannedPattern = BANNED_IMPORT_REGEX;
      message = ERROR_MESSAGE_BANNED_IMPORT;
    } else {
      bannedPattern = BANNED_EXPORT_REGEX;
      message = ERROR_MESSAGE_BANNED_EXPORT;

      let fileName = statement.getSourceFile().fileName;

      let baseName = getBaseNameWithoutExtension(fileName);

      if (baseName.startsWith('@')) {
        bannedPattern = BANNED_EXPORT_REGEX_FOR_AT_PREFFIXED;
      }
    }

    if (bannedPattern.test(specifier)) {
      this.failureManager.append({
        message,
        node: statement,
        replacement:
          type === 'export'
            ? buildBannedImportsAndExportsFixer(statement)
            : undefined,
      });
    }
  }

  private validateIndexFile(exportSpecifiers: string[]): void {
    let fileName = this.sourceFile.fileName;

    if (!INDEX_FILE_REGEX.test(fileName)) {
      return;
    }

    let dirName = Path.dirname(fileName);

    let fileNames;

    try {
      fileNames = FS.readdirSync(dirName);
    } catch (error) {
      console.error(
        `Index validation aborted due to failure of reading: ${dirName}`,
      );
      return;
    }

    let expectedExportSpecifiers = fileNames
      .map(
        (fileName): string | undefined => {
          let entryFullPath = Path.join(dirName, fileName);
          let stats;

          try {
            stats = FS.statSync(entryFullPath);
          } catch (error) {
            return undefined;
          }

          let specifier: string;

          if (stats.isFile()) {
            if (
              INDEX_FILE_REGEX.test(fileName) ||
              !hasKnownModuleExtension(fileName)
            ) {
              return undefined;
            }

            specifier = `./${removeModuleFileExtension(fileName)}`;
          } else if (stats.isDirectory()) {
            let entryNamesInFolder;

            try {
              entryNamesInFolder = FS.readdirSync(entryFullPath);
            } catch (error) {
              return undefined;
            }

            let hasIndexFile = entryNamesInFolder.some(entryNameInFolder =>
              INDEX_FILE_REGEX.test(entryNameInFolder),
            );

            if (!hasIndexFile) {
              return undefined;
            }

            specifier = `./${fileName}`;
          } else {
            return undefined;
          }

          if (BANNED_EXPORT_REGEX.test(specifier)) {
            return undefined;
          }

          return specifier;
        },
      )
      .filter((entryName): entryName is string => !!entryName);

    let missingExportIds = _.difference(
      expectedExportSpecifiers,
      exportSpecifiers,
    );

    if (missingExportIds.length) {
      this.failureManager.append({
        node: undefined,
        message: ERROR_MESSAGE_MISSING_EXPORTS,
        replacement: buildAddMissingExportsFixer(
          this.sourceFile,
          missingExportIds,
        ),
      });
    }
  }

  private validate(): void {
    let infos = this.infos;

    for (let info of infos) {
      this.validateImportOrExport(info);
    }

    let exportSpecifiers = infos
      .filter(info => info.type === 'export')
      .map(info => info.specifier);

    this.validateIndexFile(exportSpecifiers);
  }
}

function getModuleSpecifier({
  moduleSpecifier,
}: ModuleStatement): string | undefined {
  return moduleSpecifier && isStringLiteral(moduleSpecifier)
    ? removeQuotes(moduleSpecifier.getText())
    : undefined;
}

function buildBannedImportsAndExportsFixer(node: ModuleStatement): Replacement {
  return new Replacement(node.getFullStart(), node.getFullWidth(), '');
}

function buildAddMissingExportsFixer(
  sourceFile: SourceFile,
  exportNodesPath: string[],
): Replacement {
  return new Replacement(
    sourceFile.getStart(),
    sourceFile.getEnd(),
    `${[
      sourceFile.getText().trimRight(),
      ...exportNodesPath.map(
        value => `export * from '${removeModuleFileExtension(value)}';`,
      ),
    ]
      .filter(text => !!text)
      .join('\n')}\n`,
  );
}
