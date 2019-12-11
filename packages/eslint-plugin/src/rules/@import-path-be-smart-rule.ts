import Path from 'path';

import {TSESTree} from '@typescript-eslint/experimental-utils';
import {format} from 'module-lens';

import {
  ImportKind,
  createRule,
  findImports,
  getModuleSpecifier,
  isSubPathOf,
} from './@utils';

const messages = {
  nonstandardImportPath: 'The import path could be smarter.',
};

type Options = [];

type MessageId = keyof typeof messages;

export const importPathBeSmartRule = createRule<Options, MessageId>({
  name: 'import-path-be-smart',
  meta: {
    docs: {
      description:
        'Check to if import path is a shortest path and provide fixer.',
      category: 'Best Practices',
      recommended: 'error',
    },
    messages,
    schema: [],
    type: 'suggestion',
    fixable: 'code',
  },
  defaultOptions: [],

  create(context) {
    class ImportPathBeSmartWalker {
      walk(): void {
        let sourceDirName = Path.dirname(context.getFilename());

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

        let dotSlash = specifier.startsWith('./');

        // foo/bar/../abc -> foo/abc
        let normalizedSpecifier = format(
          Path.posix.normalize(specifier),
          dotSlash,
        );

        let [refSpecifier, firstNonUpperSegment] = /^(?:\.\.\/)+([^/]+)/.exec(
          specifier,
        ) || [undefined, undefined];

        if (refSpecifier) {
          if (firstNonUpperSegment === 'node_modules') {
            normalizedSpecifier = specifier
              .slice(refSpecifier.length + 1)
              .replace(/^@types\//, '');
          }

          let refPath = Path.join(sourceDirName, refSpecifier);

          // importing '../foo/bar' ('abc/foo/bar') within source file
          // 'abc/foo/test.ts', which could simply be importing './bar'.

          if (isSubPathOf(sourceDirName, refPath, true)) {
            let path = Path.join(sourceDirName, specifier);
            let relativePath = Path.relative(sourceDirName, path);
            normalizedSpecifier = format(relativePath, true);
          }
        }

        if (normalizedSpecifier === specifier) {
          return;
        }

        context.report({
          node: expression,
          messageId: 'nonstandardImportPath',
          fix: fixer => {
            return fixer.replaceTextRange(
              expression.range,
              `'${normalizedSpecifier}'`,
            );
          },
        });
      }
    }

    new ImportPathBeSmartWalker().walk();

    return {};
  },
});
