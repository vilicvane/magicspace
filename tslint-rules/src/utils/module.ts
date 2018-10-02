import * as Path from 'path';

import _ from 'lodash';
import {
  ResolveWithCategoryResult,
  build,
  resolve,
  resolveWithCategory,
} from 'module-lens';
import {LiteralExpression} from 'typescript';

import {isSubPathOf, searchUpperDir} from './path';

const KNOWN_MODULE_EXTENSION_REGEX = /\.[jt]sx?$/i;

const RELATIVE_MODULE_SPECIFIER_REGEX = /^\.{1,2}\//;
const RELATIVE_UPPER_MODULE_SPECIFIER_REGEX = /^\.\.\//;

export const MODULE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

export interface ModuleSpecifierHelperOptions {
  tsConfigSearchName?: string;
  baseUrl?: string;
}

export class ModuleSpecifierHelper {
  /** Directory of the current source file. */
  private sourceDir: string;
  private projectDir: string;

  private baseUrlDir: string | undefined;

  constructor(
    private sourceFileName: string,
    {
      tsConfigSearchName = 'tsconfig.json',
      baseUrl,
    }: ModuleSpecifierHelperOptions = {},
  ) {
    this.sourceDir = Path.dirname(sourceFileName);

    this.projectDir = searchUpperDir(this.sourceDir, tsConfigSearchName);

    if (typeof baseUrl === 'string') {
      this.baseUrlDir = Path.join(this.projectDir, baseUrl);
    }
  }

  resolve(specifier: string): string | undefined {
    return resolve(specifier, {
      sourceFileName: this.sourceFileName,
      baseUrlDir: this.baseUrlDir,
    });
  }

  resolveWithCategory(specifier: string): ResolveWithCategoryResult {
    return resolveWithCategory(specifier, {
      sourceFileName: this.sourceFileName,
      baseUrlDir: this.baseUrlDir,
    });
  }

  build(path: string, preferBaseUrl = true): string {
    return build(path, {
      sourceFileName: this.sourceFileName,
      baseUrlDir: preferBaseUrl ? this.baseUrlDir : undefined,
    });
  }

  getRelativePathToBaseUrlDir(path: string): string {
    return Path.relative(this.requireBaseUrlDir(), path);
  }

  isPathWithinBaseUrlDir(path: string): boolean {
    return isSubPathOf(path, this.requireBaseUrlDir());
  }

  private requireBaseUrlDir(): string {
    let dir = this.baseUrlDir;

    if (!dir) {
      throw new Error(
        'Expecting `baseUrlDir` to be specified for this operation',
      );
    }

    return dir;
  }
}

export function getModuleSpecifier(node: LiteralExpression): string {
  return eval(node.getText());
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
