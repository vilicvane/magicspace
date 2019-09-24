import * as Path from 'path';
import { createRule } from "./@utils/ruleCreator";

const DIRECTORY_MODULE_PATH = /^\.{1,2}(?:[\\/]\.{1,2})*[\\/]?$/;

export = createRule({
  name: "import-path-no-parent",
  meta: {
    docs: {
      description: ``,
      category: "Stylistic Issues",
      recommended: "error",
    },
    messages: {
      importPathNoParentError: `Importing from parent directory or current file is not allowed.`,
      unknownError: `This is an unknown error.`,
      // importArgumentsExceededError: `The number of arguments of import call expression is expected to be one.`,
    },
    schema: [],
    type: "problem"
  },
  defaultOptions: [],

  create(context) {
    return {
      // TODO: Import(node) {}  // lazy import as `import('.')`
      // ['CallExpression > Import'](node) {
      // },
      ImportDeclaration(node) {
        let specifier = node.source.raw;
        if (typeof specifier === 'string') {
          let sourceFileName = context.getFilename();
          let sourceDirName = Path.dirname(sourceFileName);
          specifier = specifier.replace(/^\'/, '').replace(/\'$/, '')

          let relativePath = Path.isAbsolute(specifier)
            ? Path.relative(sourceDirName, specifier)
            : (specifier = Path.relative(
              sourceDirName,
              Path.join(sourceDirName, specifier),
            ));
          if (DIRECTORY_MODULE_PATH.test(relativePath) || relativePath === '' || Path.relative(sourceFileName, Path.join(sourceDirName, specifier)) === '') {
            context.report({ messageId: "importPathNoParentError", node });
          }
        } else {
          context.report({ messageId: "unknownError", node });
        }
      },
    };
  },
});
