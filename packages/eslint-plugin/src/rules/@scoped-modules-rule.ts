import FS from 'fs';
import Path from 'path';

import {
  AST_NODE_TYPES,
  TSESLint,
  TSESTree,
} from '@typescript-eslint/experimental-utils';
import _ from 'lodash';

import {
  createRule,
  getBaseNameWithoutExtension,
  getModuleSpecifier,
  hasKnownModuleFileExtension,
  removeModuleFileExtension,
} from './@utils';

const messages = {
  bannedImport:
    'This module can not be imported, because it contains internal module with prefix `@` under a parallel directory.',
  bannedExport:
    'This module can not be exported, because it contains internal module with prefix `@` under a parallel directory.',
  missingExports: 'Missing modules expected to be exported.',
};

type Options = [];

type MessageId = keyof typeof messages;

export const scopedModulesRule = createRule<Options, MessageId>({
  name: 'scoped-modules',
  meta: {
    docs: {
      description: '',
      category: 'Stylistic Issues',
      recommended: 'error',
    },
    messages,
    schema: [
      {
        type: 'object',
        properties: {
          baseUrl: {
            type: 'string',
          },
          hierarchy: {
            type: 'object',
            additionalProperties: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
          },
        },
      },
    ],
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [],

  create(context) {
    function getFullStart(node: TSESTree.Node): number {
      let token = context.getSourceCode().getTokenBefore(node);

      if (token === null) {
        return 0;
      } else {
        return token.range[1];
      }
    }

    const INDEX_FILE_REGEX = /(?:^|[\\/])index\.(?:js|jsx|ts|tsx|d\.ts)$/i;

    const BANNED_IMPORT_REGEX = /^(?!(?:\.{1,2}[\\/])+@(?!.*[\\/]@)).*[\\/]@/;
    const BANNED_EXPORT_REGEX = /[\\/]@/;
    const BANNED_EXPORT_REGEX_FOR_AT_PREFIXED = /^\.[\\/]@(?:.*?)[\\/]@/;

    type ModuleStatement =
      | TSESTree.ImportDeclaration
      | TSESTree.ExportNamedDeclaration
      | TSESTree.ExportAllDeclaration;

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

    class ScopedModuleWalker {
      private infos: ModuleStatementInfo[] = [];

      walk(): void {
        for (let statement of context.getSourceCode().ast.body) {
          let type: ModuleStatementType;

          if (statement.type === AST_NODE_TYPES.ImportDeclaration) {
            type = 'import';
          } else if (
            statement.type === AST_NODE_TYPES.ExportNamedDeclaration ||
            statement.type === AST_NODE_TYPES.ExportAllDeclaration
          ) {
            type = 'export';
          } else {
            continue;
          }

          let specifier =
            statement.source && isStringLiteral(statement.source)
              ? getModuleSpecifier(context.getSourceCode(), statement.source)
                  .replace(/^\'/, '')
                  .replace(/\'$/, '')
              : undefined;

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
        let messageId: 'bannedImport' | 'bannedExport';

        if (type === 'import') {
          bannedPattern = BANNED_IMPORT_REGEX;
          messageId = 'bannedImport';
        } else {
          bannedPattern = BANNED_EXPORT_REGEX;
          messageId = 'bannedExport';

          let fileName = context.getFilename();

          let baseName = getBaseNameWithoutExtension(fileName);

          if (baseName.startsWith('@')) {
            bannedPattern = BANNED_EXPORT_REGEX_FOR_AT_PREFIXED;
          }
        }

        if (bannedPattern.test(specifier)) {
          context.report({
            node: statement,
            messageId,
            fix:
              type === 'export'
                ? fixer => {
                    return fixer.replaceTextRange(
                      [getFullStart(statement), statement.range[1]],
                      '',
                    );
                  }
                : undefined,
          });
        }
      }

      private validateIndexFile(exportSpecifiers: string[]): void {
        let fileName = context.getFilename();

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
          .map((fileName): string | undefined => {
            if (fileName.startsWith('.')) {
              return undefined;
            }

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
                !hasKnownModuleFileExtension(fileName)
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
          })
          .filter((entryName): entryName is string => !!entryName);

        let missingExportIds = _.difference(
          expectedExportSpecifiers,
          exportSpecifiers,
        );

        if (missingExportIds.length) {
          context.report({
            node: context.getSourceCode().ast,
            messageId: 'missingExports',
            fix: buildAddMissingExportsFixer(missingExportIds),
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

    function isStringLiteral(node: TSESTree.Node): node is TSESTree.Literal {
      return (
        (node.type === AST_NODE_TYPES.Literal &&
          typeof node.value === 'string') ||
        node.type === AST_NODE_TYPES.TemplateLiteral
      );
    }

    function buildAddMissingExportsFixer(
      exportNodesPath: string[],
    ): TSESLint.ReportFixFunction {
      return fixer =>
        fixer.replaceTextRange(
          context.getSourceCode().ast.range,
          `${[
            context
              .getSourceCode()
              .getText()
              .trimRight(),
            ...exportNodesPath.map(
              value => `export * from '${removeModuleFileExtension(value)}';`,
            ),
          ]
            .filter(text => !!text)
            .join('\n')}\n`,
        );
    }

    new ScopedModuleWalker().walk();

    return {};
  },
});
