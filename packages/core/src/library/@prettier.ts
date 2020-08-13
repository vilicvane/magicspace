/* eslint-disable @typescript-eslint/no-require-imports */

import {resolve} from 'module-lens';
import type * as Prettier from 'prettier';

export type PrettierModule = typeof Prettier;

export function getPrettierModule(sourceFileName?: string): PrettierModule {
  if (sourceFileName) {
    let modulePath = resolve('prettier', {sourceFileName});

    if (modulePath) {
      return require(modulePath);
    }
  }

  return require('prettier');
}
