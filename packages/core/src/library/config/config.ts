import * as Path from 'path';

import FastGlob from 'fast-glob';
import globalNodeModulesDir from 'global-modules';
import {resolve} from 'module-lens';
import getYarnGlobalNodeModulesParentDir from 'yarn-global-modules';

import {uniqueBy} from '../@utils';

import {RawConfig} from './raw-config';

const yarnGlobalNodeModulesParentDir = getYarnGlobalNodeModulesParentDir();

export interface Config {
  /**
   * Composable file entries to be resolved.
   */
  composables: ComposableFileEntry[];
  /**
   * Merged template options.
   */
  options: Magicspace.TemplateOptions;
}

export interface ComposableFileEntry {
  /**
   * Path to the composable file created by template author.
   */
  path: string;
  /*
   * Base directory of files that will generated, this is a relative path.
   */
  base: string;
}

export function resolveTemplateConfig(dir: string): Config {
  return _resolveTemplateConfig(Path.resolve(dir));
}

function _resolveTemplateConfig(dir: string): Config {
  let configFilePath = require.resolve(Path.join(dir, 'template'));

  // This is not identical to `dir`.
  let configFileDir = Path.dirname(configFilePath);

  let {
    extends: superSpecifiers,
    composables: filePatterns,
    root: rootDir,
    options = {},
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  } = require(configFilePath) as RawConfig;

  if (rootDir && !filePatterns) {
    // If root is specified but file patterns are not, make it '**' by default.
    filePatterns = ['**'];
  }

  rootDir = rootDir ? Path.resolve(configFileDir, rootDir) : configFileDir;

  let filePaths = filePatterns
    ? FastGlob.sync(filePatterns, {
        cwd: rootDir,
        absolute: true,
        dot: true,
        onlyFiles: true,
      })
    : [];

  let filePathSet = new Set(filePaths);

  for (let filePath of filePaths) {
    // Test whether the file has a valid extension name.
    let pathGroups = /^(.+)\.(?:c?js)$/.exec(filePath);

    if (pathGroups) {
      // If we have `foo.js.js`, delete `foo.js` if it presents. So the
      // template author can safely store a template file side-by-side.
      filePathSet.delete(pathGroups[1]);
    } else {
      filePathSet.delete(filePath);
    }
  }

  let fileEntries = Array.from(filePathSet).map(
    (filePath): ComposableFileEntry => {
      return {
        path: filePath,
        base: Path.relative(rootDir!, Path.dirname(filePath)),
      };
    },
  );

  if (typeof superSpecifiers === 'string') {
    superSpecifiers = [superSpecifiers];
  }

  if (superSpecifiers && superSpecifiers.length) {
    let superFileEntriesArray: ComposableFileEntry[][] = [];
    let superOptionsArray: Magicspace.TemplateOptions[] = [];

    for (let specifier of superSpecifiers) {
      let superDir =
        resolve(specifier, {
          sourceFileName: configFilePath,
        }) ??
        resolve(specifier, {
          sourceFileName: __filename,
        }) ??
        resolve(specifier, {
          sourceFileName: Path.join(
            yarnGlobalNodeModulesParentDir,
            '__placeholder__',
          ),
        }) ??
        resolve(specifier, {
          sourceFileName: Path.join(globalNodeModulesDir, '../__placeholder__'),
        });

      if (!superDir) {
        throw new Error(
          `Cannot resolve template ${JSON.stringify(
            specifier,
          )} specified in ${JSON.stringify(configFilePath)}`,
        );
      }

      let {
        composables: superFileEntries,
        options: superOptions,
      } = resolveTemplateConfig(superDir);

      superFileEntriesArray.push(superFileEntries);
      superOptionsArray.push(superOptions);
    }

    // It is possible that one template has been extended several times, so
    // filter out the duplicated files.
    fileEntries = uniqueBy(
      [...superFileEntriesArray.flatMap(paths => paths), ...fileEntries],
      fileEntry => fileEntry.path,
    );

    if (typeof options === 'function') {
      options = options(superOptionsArray);
    } else {
      options = Object.assign({}, ...superOptionsArray, options);
    }
  }

  return {
    composables: fileEntries,
    options,
  };
}
