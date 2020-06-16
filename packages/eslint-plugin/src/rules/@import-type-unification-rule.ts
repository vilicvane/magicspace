import {TSESTree} from '@typescript-eslint/experimental-utils';
import * as _ from 'lodash';
import {resolveWithCategory} from 'module-lens';

import {RequiredParserServices, createRule} from './@utils';

type ImportType = 'default' | 'namespace' | 'named' | 'equals';

const IMPORT_TYPES = ['default', 'namespace', 'named', 'equals'];

interface ImportInfo {
  importType: ImportType;
  identifier: TSESTree.Identifier;
}

interface ReportNeededInfo {
  importType: ImportType;
  identifier: TSESTree.Identifier;
  filename: string;
}

interface ReportInfo {
  reportNeededInfos: ReportNeededInfo[] | undefined;
  reportedImportTypeSet?: Set<ImportType>;
  reported: boolean;
}

/**
 * Example:
 *
 * <
 *   "fs": ReportInfo,
 *   "/code/src/node_modules/react": ReportInfo,
 *   "/code/src/core": ReportInfo
 * >
 */
let modulePathToReportInfoMap: Map<string, ReportInfo> = new Map();

const messages = {
  importTypeNotUnified: 'Import style should be unified.',
  importTypeNotUnifiedPreviously:
    'At {{line}}:{{column}},\tin file "{{filename}}", identifier "{{identifier}}": Import style should be unified.',
  // importTypeNotAllowed: 'This import type is not allowed.',
  // identifierNotTheSame:
  //   'The identifier of the import declaration with this import type and module specifier {{moduleSpecifier}} should be the same',
  // identifierNotAllowed:
  //   'This identifier is not allowed in this import declaration with this import type and module specifier {{moduleSpecifier}}',
};

interface AllowConfigurationObject {
  type: ImportType;
  identifiers: '*' | 'identical' | string[];
}

type Options = [
  {
    except?: {
      module: string;
      allow: (ImportType | AllowConfigurationObject)[];
    }[];
  },
];

type MessageId = keyof typeof messages;

export const importTypeUnificationRule = createRule<Options, MessageId>({
  name: 'import-type-unification-rule',
  meta: {
    docs: {
      description: 'Unify the style of imports.',
      category: 'Stylistic Issues',
      recommended: 'error',
    },
    messages,
    schema: [
      {
        type: 'object',
        properties: {
          except: {
            type: 'array',
            items: {
              type: 'object',
              required: ['module', 'allow'],
              properties: {
                module: {
                  type: 'string',
                },
                allow: {
                  type: 'array',
                  items: {
                    oneOf: [
                      {
                        type: 'string',
                        enum: IMPORT_TYPES,
                      },
                      {
                        type: 'object',
                        required: ['type', 'identifiers'],
                        properties: {
                          type: {
                            type: 'string',
                            enum: IMPORT_TYPES,
                          },
                          identifiers: {
                            oneOf: [
                              {
                                type: 'string',
                                enum: ['*', 'identical'],
                              },
                              {
                                type: 'array',
                                items: {
                                  type: 'string',
                                },
                              },
                            ],
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
          },
        },
      },
    ],
    type: 'suggestion',
  },
  defaultOptions: [{}],

  create(context, [options]) {
    interface TypeUnificationAdditionalOptions {
      baseUrlDirName?: string;
    }

    function resolveEveryImportTypeAndIdentifier(
      declaration:
        | TSESTree.ImportDeclaration
        | TSESTree.TSImportEqualsDeclaration
        | TSESTree.ExportAllDeclaration,
    ): ImportInfo[] {
      if (declaration.type === 'ImportDeclaration') {
        return declaration.specifiers.map(specifier => {
          let identifier = specifier.local;

          switch (specifier.type) {
            case 'ImportDefaultSpecifier':
              return {
                importType: 'default',
                identifier,
              };

            case 'ImportNamespaceSpecifier':
              return {
                importType: 'namespace',
                identifier,
              };

            case 'ImportSpecifier':
              return {
                importType: 'named',
                identifier,
              };

            default:
              throw new Error('Unexpected specifier type.');
          }
        });
      } else if (declaration.type === 'TSImportEqualsDeclaration') {
        return [
          {
            importType: 'equals',
            identifier: declaration.id,
          },
        ];
      } else {
        throw new Error('Unexpected Import Declaration Type');
      }
    }

    function reportErrors(importInfos: ImportInfo[]): void {
      for (let {identifier} of importInfos) {
        context.report({
          node: identifier,
          messageId: 'importTypeNotUnified', // TODO (ooyyloo): distinguish error message type 'identifierNotTheSame'
        });
      }
    }

    function reportPreviousError(
      identifier: TSESTree.Identifier,
      data: Record<string, unknown>,
    ): void {
      if (data.filename === context.getFilename()) {
        context.report({
          node: identifier,
          messageId: 'importTypeNotUnified',
        });
      } else {
        context.report({
          node: identifier,
          messageId: 'importTypeNotUnifiedPreviously',
          data,
        });
      }
    }

    function reportPreviousErrors(
      importTypes: ImportType[],
      groups: _.Dictionary<ImportInfo[]>,
      reportNeededInfos: ReportNeededInfo[],
    ): void {
      for (let info of reportNeededInfos) {
        const data = {
          filename: info.filename,
          identifier: info.identifier.name,
          line: info.identifier.loc.start.line,
          column: info.identifier.loc.start.column,
        };

        if (importTypes.length !== 1) {
          for (let importType of importTypes) {
            if (info.importType !== importType) {
              reportPreviousError(info.identifier, data);

              break;
            }
          }
        } else {
          if (info.importType !== importTypes[0]) {
            reportPreviousError(info.identifier, data);
          } else {
            for (let {identifier} of groups[info.importType]) {
              if (identifier.name !== info.identifier.name) {
                reportPreviousError(info.identifier, data);

                break;
              }
            }
          }
        }
      }
    }

    /** check if groups plus reportNeededInfos satisfy the unification constraint */
    function checkUnity(
      groups: _.Dictionary<ImportInfo[]>,
      reportNeededInfos: ReportNeededInfo[] | undefined,
      additionalInfos: {importTypes: ImportType[]},
    ): boolean {
      let importTypes =
        additionalInfos.importTypes || (Object.keys(groups) as ImportType[]);

      if (
        importTypes.length > 1 ||
        (importTypes[0] !== 'named' && groups[importTypes[0]].length > 1)
      ) {
        return false;
      }

      if (!reportNeededInfos) {
        return true;
      }

      let identifierName = groups[importTypes[0]][0].identifier.name;

      for (let info of reportNeededInfos) {
        if (info.importType !== importTypes[0]) {
          return false;
        }

        if (info.importType !== 'named') {
          if (info.identifier.name !== identifierName) {
            return false;
          }
        }
      }

      return true;
    }

    function handleIdentical(
      path: string,
      importType: ImportType,
      identifier: TSESTree.Identifier,
    ): void {
      let reportInfo = modulePathToReportInfoMap.get(path);

      if (!reportInfo) {
        modulePathToReportInfoMap.set(path, {
          reported: false,
          reportNeededInfos: [
            {
              filename: context.getFilename(),
              importType,
              identifier,
            },
          ],
        });

        return;
      }

      if (
        !reportInfo.reportedImportTypeSet ||
        !reportInfo.reportedImportTypeSet.has(importType)
      ) {
        for (let info of reportInfo.reportNeededInfos!) {
          if (
            info.importType === importType &&
            info.identifier.name !== identifier.name
          ) {
            context.report({
              node: identifier,
              messageId: 'importTypeNotUnified',
            });

            reportInfo.reportedImportTypeSet =
              reportInfo.reportedImportTypeSet || new Set();
            reportInfo.reportedImportTypeSet.add(importType);

            let newReportNeededInfos = [];

            for (let oldReportNeededInfo of reportInfo.reportNeededInfos!) {
              if (oldReportNeededInfo.importType !== importType) {
                newReportNeededInfos.push(oldReportNeededInfo);
              } else {
                const data = {
                  filename: oldReportNeededInfo.filename,
                  identifier: oldReportNeededInfo.identifier.name,
                  line: oldReportNeededInfo.identifier.loc.start.line,
                  column: oldReportNeededInfo.identifier.loc.start.column,
                };

                reportPreviousError(oldReportNeededInfo.identifier, data);
              }
            }

            reportInfo.reportNeededInfos = newReportNeededInfos;

            return;
          }
        }

        reportInfo.reportNeededInfos = (
          reportInfo.reportNeededInfos || []
        ).concat([
          {
            filename: context.getFilename(),
            importType,
            identifier,
          },
        ]);

        return;
      }

      context.report({
        node: identifier,
        messageId: 'importTypeNotUnified',
      });
    }

    function addAndReportUnificationErrors(
      moduleSpecifier: string,
      importInfos: ImportInfo[],
      additionalOptions?: TypeUnificationAdditionalOptions,
    ): void {
      let {path} = resolveWithCategory(moduleSpecifier, {
        sourceFileName: context.getFilename(),
        baseUrlDirName: additionalOptions?.baseUrlDirName,
      });

      if (!path) {
        return;
      }

      let reportInfo = modulePathToReportInfoMap.get(path);

      let groups: _.Dictionary<ImportInfo[]> = _.groupBy(
        importInfos,
        'importType',
      );
      let importTypes = Object.keys(groups) as ImportType[];

      if (
        !options.except ||
        !_.some(options.except, ['module', moduleSpecifier])
      ) {
        // This module specifier is not an exception

        if (reportInfo?.reported) {
          // there's already more than one kind of import type or more than one kind of identifier

          reportErrors(importInfos);
        } else {
          if (!reportInfo) {
            // Previously no such module specifier added

            if (
              importTypes.length !== 1 ||
              (importTypes[0] !== 'named' &&
                groups[importTypes[0]].length !== 1)
            ) {
              reportErrors(importInfos);

              modulePathToReportInfoMap.set(path, {
                reported: true,
                reportNeededInfos: undefined,
              });
            } else {
              // only one kind of import type and only one identifier

              modulePathToReportInfoMap.set(path, {
                reported: false,
                reportNeededInfos: [
                  {
                    importType: importInfos[0].importType,
                    identifier: importInfos[0].identifier,
                    filename: context.getFilename(),
                  },
                ],
              });
            }
          } else {
            // Previously such module specifier has been added

            if (
              importTypes.length !== 1 ||
              (importTypes[0] !== 'named' &&
                groups[importTypes[0]].length !== 1)
            ) {
              reportErrors(importInfos);

              reportInfo.reported = true;

              if (reportInfo.reportNeededInfos) {
                reportPreviousErrors(
                  importTypes,
                  groups,
                  reportInfo.reportNeededInfos,
                );

                reportInfo.reportNeededInfos = undefined;
              }
            } else {
              if (
                !checkUnity(groups, reportInfo.reportNeededInfos, {
                  importTypes,
                })
              ) {
                reportErrors(importInfos);

                reportPreviousErrors(
                  importTypes,
                  groups,
                  reportInfo.reportNeededInfos!,
                );

                reportInfo.reported = true;
                reportInfo.reportNeededInfos = undefined;
              } else {
                reportInfo.reportNeededInfos = (
                  reportInfo.reportNeededInfos || []
                ).concat([
                  {
                    filename: context.getFilename(),
                    importType: importTypes[0],
                    identifier: importInfos[0].identifier,
                  },
                ]);
              }
            }
          }
        }
      } else {
        // This module specifier is configured

        let allowedTypeInfos = options.except.find(
          exception => exception.module === moduleSpecifier,
        )?.allow;

        if (!allowedTypeInfos) {
          return;
        }

        for (let importType of importTypes) {
          for (let {identifier} of groups[importType]) {
            let allowed = false;

            for (let allowedTypeInfo of allowedTypeInfos) {
              if (_.isString(allowedTypeInfo)) {
                if (allowedTypeInfo !== importType) {
                  continue;
                }

                allowed = true; // fake

                handleIdentical(path, importType, identifier);
              } else if (allowedTypeInfo.type === importType) {
                if (_.isString(allowedTypeInfo.identifiers)) {
                  if (allowedTypeInfo.identifiers === '*') {
                    allowed = true;
                  } else if (allowedTypeInfo.identifiers === 'identical') {
                    allowed = true; // fake

                    handleIdentical(path, importType, identifier);
                  } else {
                    throw new Error(
                      `Wrong Configuration: identifiers: ${allowedTypeInfo.identifiers}`,
                    );
                  }
                } else if (Array.isArray(allowedTypeInfo.identifiers)) {
                  if (allowedTypeInfo.identifiers.includes(identifier.name)) {
                    allowed = true;
                  } else {
                    // Nothing. Error will be reported below.
                  }
                } else {
                  throw new Error(
                    `Wrong Configuration: identifiers: ${allowedTypeInfo.identifiers}`,
                  );
                }

                break;
              }
            }

            if (!allowed) {
              context.report({
                node: identifier,
                messageId: 'importTypeNotUnified',
              });
            }
          }
        }
      }
    }

    if (
      context.parserServices &&
      context.parserServices.program &&
      context.parserServices.esTreeNodeToTSNodeMap
    ) {
      let parserServices = context.parserServices as RequiredParserServices;
      let baseUrlDirName = parserServices.program.getCompilerOptions().baseUrl;

      return {
        ImportDeclaration: declaration => {
          let moduleSpecifier = declaration.source.value as string | null; // TODO (ooyyloo): When it will be null?

          if (declaration.source.type !== 'Literal' || !moduleSpecifier) {
            return;
          }

          let importInfos = resolveEveryImportTypeAndIdentifier(declaration);

          addAndReportUnificationErrors(moduleSpecifier, importInfos, {
            baseUrlDirName,
          });
        },
        TSImportEqualsDeclaration: declaration => {
          let moduleReference = declaration.moduleReference;

          if (
            moduleReference.type !== 'TSExternalModuleReference' ||
            moduleReference.expression.type !== 'Literal'
          ) {
            return;
          }

          let moduleSpecifier = moduleReference.expression.value as
            | string
            | null; // TODO (ooyyloo): When it will be null?

          if (!moduleSpecifier) {
            return;
          }

          let importInfos: ImportInfo[] = [
            {
              importType: 'equals',
              identifier: declaration.id,
            },
          ];

          addAndReportUnificationErrors(moduleSpecifier, importInfos, {
            baseUrlDirName,
          });
        },
      };
    } else {
      return {
        ImportDeclaration: declaration => {
          let moduleSpecifier = declaration.source.value as string | null; // TODO (ooyyloo): When it will be null?

          if (declaration.source.type !== 'Literal' || !moduleSpecifier) {
            return;
          }

          let importInfos = resolveEveryImportTypeAndIdentifier(declaration);

          addAndReportUnificationErrors(moduleSpecifier, importInfos);
        },
      };
    }
  },
});
