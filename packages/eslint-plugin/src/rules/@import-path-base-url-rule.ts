import {TSESTree} from '@typescript-eslint/experimental-utils';

import {
  ImportKind,
  ModuleSpecifierHelper,
  createRule,
  findImports,
  getFirstSegmentOfPath,
  getModuleSpecifier,
  isRelativeModuleSpecifier,
} from './@utils';

const messages = {
  importMustUseBaseURL: 'This import path must use baseUrl.',
  importMustBeRelativePath: 'This import path must be a relative path.',
};

type Options = [
  {
    baseUrl?: string;
    tsConfigSearchName?: string;
  },
];

type MessageId = keyof typeof messages;

export const importPathBaseUrl = createRule<Options, MessageId>({
  name: 'import-path-base-url',
  meta: {
    docs: {
      description: 'Check import module from baseUrl',
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
            default: '.',
          },
          tsConfigSearchName: {
            type: 'string',
            default: 'tsconfig.json',
          },
        },
      },
    ],
    type: 'problem',
    fixable: 'code',
  },
  defaultOptions: [
    {
      baseUrl: '.',
      tsConfigSearchName: 'tsconfig.json',
    },
  ],

  create(context, [options]) {
    const moduleSpecifierHelper = new ModuleSpecifierHelper(
      context.getFilename(),
      options,
    );

    function validateModuleSpecifier(
      expression: TSESTree.Literal | TSESTree.TemplateLiteral,
    ): void {
      let sourceFileName = context.getFilename();

      let helper = moduleSpecifierHelper;

      if (!helper.isPathWithinBaseUrlDir(sourceFileName)) {
        return;
      }

      let specifier = getModuleSpecifier(context.getSourceCode(), expression);

      let fullSpecifierPath = helper.resolve(specifier);

      if (
        !fullSpecifierPath ||
        !helper.isPathWithinBaseUrlDir(fullSpecifierPath)
      ) {
        return;
      }

      let relative = isRelativeModuleSpecifier(specifier);

      let relativeSourcePath = helper.getRelativePathToBaseUrlDir(
        sourceFileName,
      );

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

          context.report({
            node: expression,
            messageId: 'importMustBeRelativePath',
            fix: fixer => {
              return fixer.replaceTextRange(
                expression.range,
                relativeSpecifier,
              );
            },
          });
        }
      } else {
        if (relative) {
          let baseUrlSpecifier = `'${helper.build(fullSpecifierPath, true)}'`;

          context.report({
            node: expression,
            messageId: 'importMustUseBaseURL',
            fix: fixer => {
              return fixer.replaceTextRange(expression.range, baseUrlSpecifier);
            },
          });
        }
      }
    }

    let imports = findImports(context, ImportKind.AllStaticImports);

    for (let expression of imports) {
      validateModuleSpecifier(expression);
    }

    return {};
  },
});
