import * as FS from 'fs';
import * as Path from 'path';

import FastGlob from 'fast-glob';
import globalNodeModulesDir from 'global-modules';
import {resolve} from 'module-lens';
import {Tiva, ValidateError} from 'tiva';
import getYarnGlobalNodeModulesParentDir from 'yarn-global-modules';

import {unique, uniqueBy} from '../@utils';

import {ConfigLogger} from './config-logger';

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

export function resolveRawTemplateConfig(
  specifier: string,
  contextFileName?: string,
): Magicspace.Config {
  let result = _resolveRawTemplateConfig(
    specifier,
    contextFileName ?? Path.join(process.cwd(), '__placeholder__'),
  );

  if (!result) {
    throw new Error(
      contextFileName
        ? `Cannot resolve template ${JSON.stringify(specifier)}`
        : `Cannot resolve template ${JSON.stringify(
            specifier,
          )} from file ${JSON.stringify(contextFileName)}`,
    );
  }

  return result.config;
}

export interface ResolveTemplateConfigOptions {
  logger?: ConfigLogger;
}

export async function resolveTemplateConfig(
  specifier: string,
  contextFileName: string,
  {logger}: ResolveTemplateConfigOptions = {},
): Promise<Config> {
  let {config, optionsDeclarationFilePaths} = _resolveTemplateConfig(
    specifier,
    contextFileName,
    logger,
  );

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

interface InternalResolveRawConfigResult {
  dir: string;
  configFilePath: string;
  config: Magicspace.Config;
}

function _resolveRawTemplateConfig(
  specifier: string,
  contextFileName: string,
): InternalResolveRawConfigResult | undefined {
  let dir =
    resolve(specifier, {
      sourceFileName: contextFileName,
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

  if (!dir) {
    return undefined;
  }

  let configFilePath = require.resolve(Path.join(dir, 'template'));

  return {
    dir,
    configFilePath,
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    config: require(configFilePath),
  };
}

interface InternalResolveTemplateConfigResult {
  config: Config;
  optionsDeclarationFilePaths: string[];
}

function _resolveTemplateConfig(
  specifier: string,
  contextFileName: string,
  logger: ConfigLogger | undefined,
): InternalResolveTemplateConfigResult {
  logger?.info({
    type: 'resolve-template',
    path: specifier,
  });

  let rawResult = _resolveRawTemplateConfig(specifier, contextFileName);

  if (!rawResult) {
    throw new Error(
      `Cannot resolve template ${JSON.stringify(
        specifier,
      )} from file ${JSON.stringify(contextFileName)}`,
    );
  }

  let {
    dir,
    configFilePath,
    config: {
      extends: superSpecifiers,
      composables: filePatterns,
      root: rootDir,
      options = {},
    },
  } = rawResult;

  // This is not identical to `dir`.
  let configFileDir = Path.dirname(configFilePath);

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
      }).map(path => Path.normalize(path))
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
      let {
        config: {composables: superFileEntries, options: superOptions},
        optionsDeclarationFilePaths: superOptionsDeclarationFilePaths,
      } = _resolveTemplateConfig(specifier, configFilePath, logger);

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
