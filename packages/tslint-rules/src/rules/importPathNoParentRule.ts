import * as Path from 'path';

import {AbstractWalker, IRuleMetadata, RuleFailure, Rules} from 'tslint';
import {ImportKind, findImports} from 'tsutils';
import {LiteralExpression, SourceFile} from 'typescript';

import {getModuleSpecifier} from './@utils';

const DIRECTORY_MODULE_PATH = /^\.{1,2}(?:[\\/]\.{2})*[\\/]?$/;
const ERROR_MESSAGE_BANNED_PARENT_IMPORT =
  'Importing from parent directory is not allowed.';

export class Rule extends Rules.AbstractRule {
  apply(sourceFile: SourceFile): RuleFailure[] {
    return this.applyWithWalker(
      new ImportPathNoParentWalker(
        sourceFile,
        Rule.metadata.ruleName,
        undefined,
      ),
    );
  }

  static metadata: IRuleMetadata = {
    ruleName: 'import-path-no-parent',
    description: '',
    optionsDescription: '',
    options: undefined,
    type: 'maintainability',
    hasFix: false,
    typescriptOnly: false,
  };
}

class ImportPathNoParentWalker extends AbstractWalker<undefined> {
  walk(): void {
    let sourceFile = this.sourceFile;
    let sourceFileName = sourceFile.fileName;
    let sourceDirName = Path.dirname(sourceFileName);

    let imports = findImports(this.sourceFile, ImportKind.AllImports);

    for (let expression of imports) {
      this.validateModuleSpecifier(expression, sourceDirName);
    }
  }

  private validateModuleSpecifier(
    expression: LiteralExpression,
    sourceDirName: string,
  ): void {
    let specifier = getModuleSpecifier(expression);

    specifier = Path.isAbsolute(specifier)
      ? Path.relative(sourceDirName, specifier)
      : (specifier = Path.relative(
          sourceDirName,
          Path.join(sourceDirName, specifier),
        ));

    if (!DIRECTORY_MODULE_PATH.test(specifier) && specifier !== '') {
      return;
    }

    this.addFailureAtNode(
      expression.parent,
      ERROR_MESSAGE_BANNED_PARENT_IMPORT,
    );
  }
}
