import * as FS from 'fs';
import * as Path from 'path';

import FastGlob from 'fast-glob';
import globalNodeModulesDir from 'global-modules';
import _ from 'lodash';
import {resolve} from 'module-lens';
import {Tiva, ValidateError} from 'tiva';
import getYarnGlobalNodeModulesParentDir from 'yarn-global-modules';

import {ConfigLogger} from './config-logger';

const TYPES_PATH = Path.join(__dirname, '../../../types/index.d.ts');

const yarnGlobalNodeModulesParentDir = getYarnGlobalNodeModulesParentDir();

export interface Config {
  /**
   * Composable file entries to be resolved.
   */
  composables: ComposableModuleEntry[];
  /**
   * Template lifecycle scripts.
   */
  scripts: TemplateScripts;
  /**
   * Merged template options.
   */
  options: Magicspace.TemplateOptions;
}

export interface ComposableModuleEntry {
  /**
   * Path to the composable file created by template author.
   */
  path: string;
  /*
   * Base directory of files that will generated, this is a relative path.
   */
  base: string;
}

export interface TemplateScripts {
  postgenerate: TemplateScriptEntry[];
}

export type TemplateScriptsLifecycleName = keyof TemplateScripts;

export interface TemplateScriptEntry {
  configFilePath: string;
  script: string;
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
        ? `Cannot resolve template ${JSON.stringify(
            specifier,
          )} from file ${JSON.stringify(contextFileName)}`
        : `Cannot resolve template ${JSON.stringify(specifier)}`,
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
      composables: composablePatterns,
      scripts: rawScripts = {},
      root: rootDir,
      options = {},
    },
  } = rawResult;

  // This is not identical to `dir`.
  let configFileDir = Path.dirname(configFilePath);

  if (rootDir && !composablePatterns) {
    // If root is specified but file patterns are not, make it '**' by default.
    composablePatterns = ['**'];
  }

  rootDir = rootDir ? Path.resolve(configFileDir, rootDir) : configFileDir;

  let composableModulePaths = composablePatterns
    ? FastGlob.sync(composablePatterns, {
        cwd: rootDir,
        absolute: true,
        dot: true,
        onlyFiles: true,
      }).map(path => Path.normalize(path))
    : [];

  let composableModulePathSet = new Set(composableModulePaths);

  for (let composableModulePath of composableModulePaths) {
    // Test whether the file has a valid extension name.
    let pathGroups = /^(.+)\.js$/.exec(composableModulePath);

    if (pathGroups) {
      // If we have `foo.js.js`, exclude `foo.js` from composables if it
      // presents. So the template author can safely store a template file
      // side-by-side.
      composableModulePathSet.delete(pathGroups[1]);
    } else {
      composableModulePathSet.delete(composableModulePath);
    }
  }

  if (
    composablePatterns &&
    composablePatterns.length > 0 &&
    composableModulePathSet.size === 0
  ) {
    throw new Error(
      `No composable module found for patterns ${JSON.stringify(
        composablePatterns,
      )} in template ${JSON.stringify(configFilePath)}`,
    );
  }

  let composableModuleEntries = Array.from(composableModulePathSet).map(
    (path): ComposableModuleEntry => {
      return {
        path,
        base: Path.relative(rootDir!, Path.dirname(path)),
      };
    },
  );

  let scripts: TemplateScripts = {
    postgenerate: rawScripts.postgenerate
      ? [
          {
            configFilePath,
            script: rawScripts.postgenerate,
          },
        ]
      : [],
  };

  let optionsDeclarationFilePath = Path.join(dir, 'template-options.d.ts');

  let optionsDeclarationFilePaths = FS.existsSync(optionsDeclarationFilePath)
    ? [optionsDeclarationFilePath]
    : [];

  if (typeof superSpecifiers === 'string') {
    superSpecifiers = [superSpecifiers];
  }

  if (superSpecifiers && superSpecifiers.length) {
    let superComposableModuleEntriesArray: ComposableModuleEntry[][] = [];
    let superScriptsArray: TemplateScripts[] = [];
    let superOptionsArray: Magicspace.TemplateOptions[] = [];
    let superOptionsDeclarationFilePathsArray: string[][] = [];

    for (let specifier of superSpecifiers) {
      let {
        config: {
          composables: superComposableModuleEntries,
          scripts: superScripts,
          options: superOptions,
        },
        optionsDeclarationFilePaths: superOptionsDeclarationFilePaths,
      } = _resolveTemplateConfig(specifier, configFilePath, logger);

      superComposableModuleEntriesArray.push(superComposableModuleEntries);
      superScriptsArray.push(superScripts);
      superOptionsArray.push(superOptions);
      superOptionsDeclarationFilePathsArray.push(
        superOptionsDeclarationFilePaths,
      );
    }

    // It is possible that one template has been extended several times, so
    // filter out the duplicated files.
    composableModuleEntries = _.unionBy(
      superComposableModuleEntriesArray.flatMap(paths => paths),
      composableModuleEntries,
      entry => entry.path,
    );

    for (let [key, scriptEntries] of Object.entries(scripts) as [
      TemplateScriptsLifecycleName,
      TemplateScriptEntry[],
    ][]) {
      scripts[key] = _.unionBy(
        superScriptsArray.flatMap(superScripts => superScripts[key]),
        scriptEntries,
        entry => entry.configFilePath,
      );
    }

    if (typeof options === 'function') {
      options = options(superOptionsArray);
    } else {
      options = Object.assign({}, ...superOptionsArray, options);
    }

    optionsDeclarationFilePaths = _.union(
      superOptionsDeclarationFilePathsArray.flatMap(paths => paths),
      optionsDeclarationFilePaths,
    );
  }

  return {
    config: {
      composables: composableModuleEntries,
      scripts,
      options,
    },
    optionsDeclarationFilePaths,
  };
}
