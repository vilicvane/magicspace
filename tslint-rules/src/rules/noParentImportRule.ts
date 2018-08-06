import * as FS from 'fs';
import * as Path from 'path';

import * as _ from 'lodash';
import {
  AbstractWalker,
  IRuleMetadata,
  Replacement,
  RuleFailure,
  Rules,
} from 'tslint';
import {isImportDeclaration} from 'tsutils';
import * as Typescript from 'typescript';

import {FailureManager} from '../utils/failure-manager';
import {removeModuleFileExtension, removeQuotes} from '../utils/path';

const RELATIVE_PATH = /^(?:\.{1,2}[\\/])+/;
const ERROR_MESSAGE_BANNED_PARENT_IMPORT =
  'this module can not be imported, because it is imported from parent directory.';

export class Rule extends Rules.AbstractRule {
  apply(sourceFile: Typescript.SourceFile): RuleFailure[] {
    return this.applyWithWalker(
      new NoParentImportRule(sourceFile, Rule.metadata.ruleName, undefined),
    );
  }

  static metadata: IRuleMetadata = {
    ruleName: 'no-parent-import',
    description: 'No additional parameters are required',
    optionsDescription: '',
    options: undefined,
    type: 'maintainability',
    hasFix: true,
    typescriptOnly: false,
  };
}

class NoParentImportRule extends AbstractWalker<undefined> {
  /** 装 import 语句的容器 */
  private importExpressions: Typescript.Node[] = [];
  private failureManager = new FailureManager(this);

  walk(sourceFile: Typescript.SourceFile): void {
    for (let statement of sourceFile.statements) {
      if (isImportDeclaration(statement)) {
        let specifier = statement.moduleSpecifier;

        if (!RELATIVE_PATH.test(removeQuotes(specifier.getText()))) {
          continue;
        }

        this.importExpressions.push(specifier);
      }
    }

    this.validate();
  }

  private validate() {
    let importExpressions = this.importExpressions;
    let sourceFileDirName = Path.dirname(this.sourceFile.fileName);

    // 从上至下寻找模块
    let findSameModule = (
      currentDirName: string | undefined,
      pathParts: string[],
      moduleName: string,
    ): string | undefined => {
      let part = pathParts.shift()!;

      if (!pathParts.length) {
        return;
      }

      currentDirName = currentDirName
        ? Path.join(currentDirName, part)
        : Path.join(sourceFileDirName, part);

      let files = FS.readdirSync(currentDirName)
        .filter(file => {
          return FS.statSync(Path.join(currentDirName!, file)).isFile();
        })
        .map(file => removeModuleFileExtension(file));

      if (_.includes(files, moduleName)) {
        return Path.relative(sourceFileDirName, currentDirName);
      } else {
        return findSameModule(currentDirName, pathParts, moduleName);
      }
    };

    for (let expression of importExpressions) {
      let text = removeQuotes(expression.getText());
      let importPath = Path.isAbsolute(text)
        ? Path.relative(sourceFileDirName, text)
        : text;
      let moduleName = Path.basename(importPath);
      let modulePath = findSameModule(
        undefined,
        Path.dirname(importPath).split(Path.sep),
        removeModuleFileExtension(moduleName),
      );

      if (modulePath) {
        let node = expression.parent!;
        this.failureManager.append({
          node,
          message: ERROR_MESSAGE_BANNED_PARENT_IMPORT,
          fixer: new Replacement(
            expression.getStart(),
            expression.getEnd(),
            `'${Path.join(modulePath, moduleName)}'`,
          ),
        });
      }
    }

    this.failureManager.throw();
  }
}
