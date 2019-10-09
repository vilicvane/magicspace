import Path from 'path';

import {TSESTree} from '@typescript-eslint/experimental-utils';

import {
  ImportKind,
  ModuleSpecifierHelper,
  createRule,
  findImports,
  getFirstSegmentOfPath,
  getModuleSpecifier,
  removeModuleFileExtension,
} from './@utils';

const messages = {
  bannedHierarchyImport:
    'Importing the target module from this file is not allowed',
};

type Options = [
  {
    baseUrl: string;
    hierarchy: object;
  },
];

type MessageId = keyof typeof messages;

export const importPathStrictHierarchyRule = createRule<Options, MessageId>({
  name: 'import-path-strict-hierarchy',
  meta: {
    docs: {
      description: 'Check import module from baseUrl',
      category: 'Best Practices',
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
          tsConfigSearchName: {
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
  },
  defaultOptions: [
    {
      baseUrl: '.',
      hierarchy: {},
    },
  ],

  create(context, [options]) {
    let parsedOptions = options || [];

    class ImportPathStrictHierarchyWalker {
      private moduleSpecifierHelper = new ModuleSpecifierHelper(
        context.getFilename(),
        parsedOptions,
      );

      walk(): void {
        let {hierarchy} = parsedOptions;

        let sourceNameToShallowlyAllowedNameSetMap = new Map<
          string,
          Set<string>
        >();

        for (let [sourceName, allowedNames] of Object.entries(hierarchy)) {
          sourceNameToShallowlyAllowedNameSetMap.set(
            sourceName,
            new Set(allowedNames),
          );
        }

        let imports = findImports(context, ImportKind.AllImports);

        for (let expression of imports) {
          this.validateModuleSpecifier(
            expression,
            sourceNameToShallowlyAllowedNameSetMap,
          );
        }
      }

      private validateModuleSpecifier(
        expression: TSESTree.LiteralExpression,
        sourceNameToAllowedNameSetMap: Map<string, Set<string>>,
      ): void {
        let helper = this.moduleSpecifierHelper;

        let specifier = getModuleSpecifier(context.getSourceCode(), expression);
        let {path: specifierPath, category} = helper.resolveWithCategory(
          specifier,
        );

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
          relativeSpecifierPathFirstSegment ===
            relativeSourceFileNameFirstSegment
        ) {
          return;
        }

        let allowedSet = sourceNameToAllowedNameSetMap.get(
          relativeSourceFileNameFirstSegment,
        );

        if (allowedSet && !allowedSet.has(relativeSpecifierPathFirstSegment)) {
          context.report({
            node: expression.parent!,
            messageId: 'bannedHierarchyImport',
          });
        }
      }
    }

    new ImportPathStrictHierarchyWalker().walk();

    return {};
  },
});
