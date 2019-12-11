import * as Path from 'path';

import {TSESTree} from '@typescript-eslint/experimental-utils';

import {
  ImportKind,
  createRule,
  findImports,
  getModuleSpecifier,
} from './@utils';

const DIRECTORY_MODULE_PATH = /^\.{1,2}(?:[\\/]\.{1,2})*[\\/]?$/;

const messages = {
  bannedParentImport:
    'Importing from parent directory or current file is not allowed.',
};

type Options = [];

type MessageId = keyof typeof messages;

export const importPathNoParentRule = createRule<Options, MessageId>({
  name: 'import-path-no-parent',
  meta: {
    docs: {
      description: '',
      category: 'Possible Errors',
      recommended: 'error',
    },
    messages,
    schema: [],
    type: 'problem',
  },
  defaultOptions: [],

  create(context) {
    class ImportPathNoParentWalker {
      walk(): void {
        let sourceFileName = context.getFilename();
        let sourceDirName = Path.dirname(sourceFileName);

        let imports = findImports(context, ImportKind.AllImports);

        for (let expression of imports) {
          this.validateModuleSpecifier(expression, sourceDirName);
        }
      }

      private validateModuleSpecifier(
        expression: TSESTree.LiteralExpression,
        sourceDirName: string,
      ): void {
        let specifier = getModuleSpecifier(context.getSourceCode(), expression);

        specifier = Path.isAbsolute(specifier)
          ? Path.relative(sourceDirName, specifier)
          : (specifier = Path.relative(
              sourceDirName,
              Path.join(sourceDirName, specifier),
            ));

        if (!DIRECTORY_MODULE_PATH.test(specifier) && specifier !== '') {
          return;
        }

        context.report({
          node: expression.parent!,
          messageId: 'bannedParentImport',
        });
      }
    }

    new ImportPathNoParentWalker().walk();

    return {};
  },
});
