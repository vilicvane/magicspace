import * as Path from 'path';

import FastGlob from 'fast-glob';

import {requireOrImport} from '../@utils.js';
import type {Composable, FileGenerics} from '../file/index.js';

import type {ComposableModuleDefault} from './composable.js';

const COMPOSABLES_MATCH_PATTERN_DEFAULT = '**/*.js';

export type BoilerplateComposable<TFile extends FileGenerics = FileGenerics> = {
  source: string;
  target: string;
} & Composable<TFile>;

export type ComposablesMatchOptions = {
  root: string;
  pattern?: string | string[];
};

export async function composables(
  matchOptions: string | ComposablesMatchOptions,
  composableOptions: object,
): Promise<BoilerplateComposable[]> {
  if (typeof matchOptions === 'string') {
    matchOptions = {root: matchOptions};
  }

  const {root, pattern = COMPOSABLES_MATCH_PATTERN_DEFAULT} = matchOptions;

  const patterns = Array.isArray(pattern) ? pattern : [pattern];

  const paths = (
    await FastGlob(patterns, {
      cwd: root,
      absolute: true,
      dot: true,
      onlyFiles: true,
    })
  ).map(path => Path.normalize(path));

  const pathSet = new Set(paths);

  for (const path of pathSet) {
    const [, possibleTemplatePath] = /^(.+)\.js$/.exec(path) ?? [];

    if (possibleTemplatePath) {
      // If we have `foo.js.js`, exclude `foo.js` from composables if it
      // presents. So the boilerplate author can safely store a template file
      // side-by-side.
      pathSet.delete(possibleTemplatePath);
    }
  }

  if (pathSet.size === 0) {
    throw new Error(
      `No composable module found for pattern ${JSON.stringify(pattern)}.`,
    );
  }

  const allComposables: BoilerplateComposable[] = [];

  for (const composableModulePath of pathSet) {
    let composables = (await requireOrImport(composableModulePath))
      .default as ComposableModuleDefault;

    if (typeof composables === 'function') {
      composables = await composables(composableOptions);
    }

    if (!composables) {
      composables = [];
    } else if (!Array.isArray(composables)) {
      composables = [composables];
    }

    const baseDir = Path.relative(root, Path.dirname(composableModulePath));

    allComposables.push(
      ...composables.map(composable => {
        const {path} = composable;

        return {
          source: composableModulePath,
          target: path
            ? Path.join(baseDir, path)
            : Path.join(
                baseDir,
                Path.basename(
                  composableModulePath,
                  Path.extname(composableModulePath),
                ),
              ),
          ...composable,
        };
      }),
    );
  }

  return allComposables;
}
