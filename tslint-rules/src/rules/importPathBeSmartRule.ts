import * as Path from 'path';

import {format} from 'module-lens';
import {
  AbstractWalker,
  IRuleMetadata,
  Replacement,
  RuleFailure,
  Rules,
} from 'tslint';
import {ImportKind, findImports} from 'tsutils';
import {LiteralExpression, SourceFile} from 'typescript';

import {FailureManager, getModuleSpecifier, isSubPathOf} from '../utils';

const ERROR_MESSAGE_NONSTANDARD_IMPORT_PATH =
  'The import path could be smarter.';

export class Rule extends Rules.AbstractRule {
  apply(sourceFile: SourceFile): RuleFailure[] {
    return this.applyWithWalker(
      new ImportPathBeSmartWalker(
        sourceFile,
        Rule.metadata.ruleName,
        undefined,
      ),
    );
  }

  static metadata: IRuleMetadata = {
    ruleName: 'import-path-be-smart',
    description: 'Check to if import path is a shortest path and provide fixer',
    optionsDescription: '',
    options: undefined,
    type: 'maintainability',
    hasFix: true,
    typescriptOnly: false,
  };
}

class ImportPathBeSmartWalker extends AbstractWalker<undefined> {
  private failureManager = new FailureManager<undefined>(this);

  private sourceFileName = this.sourceFile.fileName;
  private sourceDir = Path.dirname(this.sourceFileName);

  walk(): void {
    let imports = findImports(this.sourceFile, ImportKind.AllImports);

    for (let expression of imports) {
      this.validateImport(expression);
    }
  }

  private validateImport(expression: LiteralExpression): void {
    let specifier = getModuleSpecifier(expression);

    let dotSlash = specifier.startsWith('./');

    // foo/bar/../abc -> foo/abc
    let normalizedSpecifier = format(Path.posix.normalize(specifier), dotSlash);

    let [refSpecifier, firstNonUpperSegment] = /^(?:\.\.\/)+([^/]+)/.exec(
      specifier,
    ) || [undefined, undefined];

    if (refSpecifier) {
      if (firstNonUpperSegment === 'node_modules') {
        normalizedSpecifier = specifier
          .slice(refSpecifier.length + 1)
          .replace(/^@types\//, '');
      }

      let sourceDir = this.sourceDir;

      let refPath = Path.join(sourceDir, refSpecifier);

      // importing '../foo/bar' ('abc/foo/bar') within source file
      // 'abc/foo/test.ts', which could simply be importing './bar'.

      if (isSubPathOf(sourceDir, refPath, true)) {
        let path = Path.join(sourceDir, specifier);
        let relativePath = Path.relative(sourceDir, path);
        normalizedSpecifier = format(relativePath, true);
      }
    }

    if (normalizedSpecifier === specifier) {
      return;
    }

    this.failureManager.append({
      node: expression,
      message: ERROR_MESSAGE_NONSTANDARD_IMPORT_PATH,
      replacement: new Replacement(
        expression.getStart(),
        expression.getWidth(),
        `'${normalizedSpecifier}'`,
      ),
    });
  }
}
