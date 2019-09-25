import * as Path from 'path';

import _ from 'lodash';
import {
  ResolveWithCategoryResult,
  build,
  resolve,
  resolveWithCategory,
} from 'module-lens';
import {
  TSESLint,
  TSESTree,
} from '@typescript-eslint/experimental-utils';

import { isSubPathOf, searchUpperDir } from './path';

const KNOWN_MODULE_EXTENSION_REGEX = /(?!\.d\.ts$)\.[jt]sx?$/i;

const RELATIVE_MODULE_SPECIFIER_REGEX = /^\.{1,2}\//;
const RELATIVE_UPPER_MODULE_SPECIFIER_REGEX = /^\.\.\//;

export const MODULE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

export interface ModuleSpecifierHelperOptions {
  tsConfigSearchName?: string;
  baseUrl?: string;
}

export class ModuleSpecifierHelper {
  readonly sourceDirName: string;
  readonly projectDirName: string;

  readonly baseUrlDirName: string | undefined;

  constructor(
    readonly sourceFileName: string,
    {
      tsConfigSearchName = 'tsconfig.json',
      baseUrl,
    }: ModuleSpecifierHelperOptions = {},
  ) {
    this.sourceDirName = Path.dirname(sourceFileName);

    this.projectDirName = searchUpperDir(
      this.sourceDirName,
      tsConfigSearchName,
    );

    if (typeof baseUrl === 'string') {
      this.baseUrlDirName = Path.join(this.projectDirName, baseUrl);
    }
  }

  resolve(specifier: string): string | undefined {
    return resolve(specifier, {
      sourceFileName: this.sourceFileName,
      baseUrlDirName: this.baseUrlDirName,
    });
  }

  resolveWithCategory(specifier: string): ResolveWithCategoryResult {
    return resolveWithCategory(specifier, {
      sourceFileName: this.sourceFileName,
      baseUrlDirName: this.baseUrlDirName,
    });
  }

  build(path: string, preferBaseUrl = true): string {
    return build(path, {
      sourceFileName: this.sourceFileName,
      baseUrlDirName: preferBaseUrl ? this.baseUrlDirName : undefined,
    });
  }

  getRelativePathToBaseUrlDir(path: string): string {
    return Path.relative(this.requireBaseUrlDirName(), path);
  }

  isPathWithinBaseUrlDir(path: string): boolean {
    return isSubPathOf(path, this.requireBaseUrlDirName());
  }

  private requireBaseUrlDirName(): string {
    let dirName = this.baseUrlDirName;

    if (!dirName) {
      throw new Error(
        'Expecting `baseUrlDirName` to be specified for this operation',
      );
    }

    return dirName;
  }
}

export function getModuleSpecifier(sourceCode: TSESLint.SourceCode, node: TSESTree.LiteralExpression): string {
  return eval(sourceCode.getText(node));
}

export function isRelativeModuleSpecifier(specifier: string): boolean {
  return RELATIVE_MODULE_SPECIFIER_REGEX.test(specifier);
}

export function isRelativeUpperModuleSpecifier(specifier: string): boolean {
  return RELATIVE_UPPER_MODULE_SPECIFIER_REGEX.test(specifier);
}

export function removeModuleFileExtension(fileName: string): string {
  return fileName.replace(/\.(?:[jt]sx?|d\.ts)$/i, '');
}

export function hasKnownModuleFileExtension(fileName: string): boolean {
  return KNOWN_MODULE_EXTENSION_REGEX.test(fileName);
}
