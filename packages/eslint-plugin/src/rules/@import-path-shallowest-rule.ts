import Path from 'path';

import {TSESTree} from '@typescript-eslint/experimental-utils';

import {
  ImportKind,
  MODULE_EXTENSIONS,
  ModuleSpecifierHelper,
  createRule,
  findImports,
  gentleStat,
  getModuleSpecifier,
  isSubPathOf,
} from './@utils';

const messages = {
  canNotImportDirectoryModules:
    'Can not import this module that have index file in the directory where this module is located.',
};

type Options = [
  {
    baseUrl?: string;
    tsConfigSearchName?: string;
  },
];

type MessageId = keyof typeof messages;

export const importPathShallowestRule = createRule<Options, MessageId>({
  name: 'import-path-shallowest',
  meta: {
    docs: {
      description:
        'Validate import expression of path that directory module path whether module under the path or not',
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
        },
      },
    ],
    type: 'suggestion',
  },
  defaultOptions: [{}],

  create(context, [options]) {
    class ImportPathShallowestWalker {
      private moduleSpecifierHelper = new ModuleSpecifierHelper(
        context.getFilename(),
        options,
      );

      walk(): void {
        let imports = findImports(context, ImportKind.AllImports);

        for (let expression of imports) {
          this.validate(expression);
        }
      }

      private validate(expression: TSESTree.LiteralExpression): void {
        let helper = this.moduleSpecifierHelper;
        let specifier = getModuleSpecifier(context.getSourceCode(), expression);

        let {category, path} = helper.resolveWithCategory(specifier);

        let sourceFileName = context.getFilename();

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

        let parentDirName = Path.dirname(path);

        if (!hasIndexFile(parentDirName)) {
          return;
        }

        context.report({
          node: expression.parent!,
          messageId: 'canNotImportDirectoryModules',
        });
      }
    }

    function hasIndexFile(dirName: string): boolean {
      let possibleIndexPaths = MODULE_EXTENSIONS.map(extension =>
        Path.join(dirName, `index${extension}`),
      );

      return possibleIndexPaths.some(path => {
        let stats = gentleStat(path);
        return !!stats && stats.isFile();
      });
    }

    new ImportPathShallowestWalker().walk();

    return {};
  },
});
