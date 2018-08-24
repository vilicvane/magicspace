import * as Path from 'path';

import {AbstractWalker, IRuleMetadata, RuleFailure, Rules} from 'tslint';
import {ImportKind, findImports} from 'tsutils';
import * as Typescript from 'typescript';

import {removeQuotes} from '../utils/path';

const DIRECTORY_MODULE_PATH = /^\.{1,2}(?:[\\/]\.{2})*[\\/]?$/;
const ERROR_MESSAGE_BANNED_PARENT_IMPORT =
  'Importing from parent directory is not allowed.';

export class Rule extends Rules.AbstractRule {
  apply(sourceFile: Typescript.SourceFile): RuleFailure[] {
    return this.applyWithWalker(
      new NoParentImportRule(sourceFile, Rule.metadata.ruleName, undefined),
    );
  }

  static metadata: IRuleMetadata = {
    ruleName: 'no-parent-import',
    description: '',
    optionsDescription: '',
    options: undefined,
    type: 'maintainability',
    hasFix: false,
    typescriptOnly: false,
  };
}

class NoParentImportRule extends AbstractWalker<undefined> {
  /** 装 import 语句的容器 */
  private importExpressions: Typescript.Expression[] = [];

  walk(sourceFile: Typescript.SourceFile): void {
    for (let expression of findImports(
      sourceFile,
      ImportKind.AllStaticImports,
    )) {
      this.importExpressions.push(expression);
    }

    this.validate();
  }

  private validate(): void {
    let importExpressions = this.importExpressions;
    let sourceDirName = Path.dirname(this.sourceFile.fileName);

    for (let expression of importExpressions) {
      let modulePath: string = removeQuotes(expression.getText());

      modulePath = Path.isAbsolute(modulePath)
        ? Path.relative(sourceDirName, modulePath)
        : (modulePath = Path.relative(
            sourceDirName,
            Path.join(sourceDirName, modulePath),
          ));

      if (!DIRECTORY_MODULE_PATH.test(modulePath) && modulePath !== '') {
        continue;
      }

      this.addFailureAtNode(
        expression.parent,
        ERROR_MESSAGE_BANNED_PARENT_IMPORT,
      );
    }
  }
}
