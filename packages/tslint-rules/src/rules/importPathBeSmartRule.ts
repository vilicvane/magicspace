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

import {getModuleSpecifier, isSubPathOf} from './@utils';

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
  walk(): void {
    let sourceFile = this.sourceFile;
    let sourceDirName = Path.dirname(sourceFile.fileName);

    let imports = findImports(sourceFile, ImportKind.AllImports);

    for (let expression of imports) {
      this.validateModuleSpecifier(expression, sourceDirName);
    }
  }

  private validateModuleSpecifier(
    expression: LiteralExpression,
    sourceDirName: string,
  ): void {
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

    this.addFailureAtNode(
      expression,
      ERROR_MESSAGE_NONSTANDARD_IMPORT_PATH,
      new Replacement(
        expression.getStart(),
        expression.getWidth(),
        `'${normalizedSpecifier}'`,
      ),
    );
  }
}
