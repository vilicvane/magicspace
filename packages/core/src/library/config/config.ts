import * as FS from 'fs';
import * as Path from 'path';

import FastGlob from 'fast-glob';
import globalNodeModulesDir from 'global-modules';
import {resolve} from 'module-lens';
import {Tiva, ValidateError} from 'tiva';
import getYarnGlobalNodeModulesParentDir from 'yarn-global-modules';

import {unique, uniqueBy} from '../@utils';

const TYPES_PATH = Path.join(__dirname, '../../../types/index.d.ts');

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

export {ValidateError};

export async function resolveTemplateConfig(dir: string): Promise<Config> {
  dir = Path.resolve(dir);

  let {config, optionsDeclarationFilePaths} = _resolveTemplateConfig(dir);

  let types = [TYPES_PATH, ...optionsDeclarationFilePaths].map(path =>
    path.replace(/\.d\.ts$/, ''),
  );

  let tiva = new Tiva({
    compilerOptions: {
      types,
      strict: true,
    },
  });

  await tiva.validate('Magicspace.TemplateOptions', config.options);

  await tiva.dispose();

  return config;
}

interface InternalResolveTemplateConfigResult {
  config: Config;
  optionsDeclarationFilePaths: string[];
}

function _resolveTemplateConfig(
  dir: string,
): InternalResolveTemplateConfigResult {
  let configFilePath = require.resolve(Path.join(dir, 'template'));

  // This is not identical to `dir`.
  let configFileDir = Path.dirname(configFilePath);

  let {
    extends: superSpecifiers,
    composables: filePatterns,
    root: rootDir,
    options = {},
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  } = require(configFilePath) as Magicspace.Config;

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
    let pathGroups = /^(.+)\.js$/.exec(filePath);

    if (pathGroups) {
      // If we have `foo.js.js`, exclude `foo.js` from composables if it
      // presents. So the template author can safely store a template file
      // side-by-side.
      filePathSet.delete(pathGroups[1]);
    } else {
      filePathSet.delete(filePath);
    }
  }

  if (filePatterns && filePatterns.length > 0 && filePathSet.size === 0) {
    throw new Error(
      `No composable module found for patterns ${JSON.stringify(
        filePatterns,
      )} in template ${JSON.stringify(configFilePath)}`,
    );
  }

  let fileEntries = Array.from(filePathSet).map(
    (filePath): ComposableFileEntry => {
      return {
        path: filePath,
        base: Path.relative(rootDir!, Path.dirname(filePath)),
      };
    },
  );

  let optionsDeclarationFilePath = Path.join(dir, 'template-options.d.ts');

  let optionsDeclarationFilePaths = FS.existsSync(optionsDeclarationFilePath)
    ? [optionsDeclarationFilePath]
    : [];

  if (typeof superSpecifiers === 'string') {
    superSpecifiers = [superSpecifiers];
  }

  if (superSpecifiers && superSpecifiers.length) {
    let superFileEntriesArray: ComposableFileEntry[][] = [];
    let superOptionsArray: Magicspace.TemplateOptions[] = [];
    let superOptionsDeclarationFilePathsArray: string[][] = [];

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

      console.info(`Resolved template ${JSON.stringify(superDir)}.`);

      if (!superDir) {
        throw new Error(
          `Cannot resolve template ${JSON.stringify(
            specifier,
          )} specified in ${JSON.stringify(configFilePath)}`,
        );
      }

      let {
        config: {composables: superFileEntries, options: superOptions},
        optionsDeclarationFilePaths: superOptionsDeclarationFilePaths,
      } = _resolveTemplateConfig(superDir);

      superFileEntriesArray.push(superFileEntries);
      superOptionsArray.push(superOptions);
      superOptionsDeclarationFilePathsArray.push(
        superOptionsDeclarationFilePaths,
      );
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

    optionsDeclarationFilePaths = unique([
      ...superOptionsDeclarationFilePathsArray.flatMap(paths => paths),
      ...optionsDeclarationFilePaths,
    ]);
  }

  return {
    config: {
      composables: fileEntries,
      options,
    },
    optionsDeclarationFilePaths,
  };
}
