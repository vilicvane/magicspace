import {readFile} from 'fs/promises';
import {createRequire} from 'module';
import * as Path from 'path';
import {fileURLToPath} from 'url';

import EnhancedResolve from 'enhanced-resolve';
import _ from 'lodash';
import stripJSONComments from 'strip-json-comments';
import type {JSONSchema} from 'x-value';
import * as x from 'x-value';

import {requireOrImport} from './@utils.js';
import type {
  Boilerplate,
  BoilerplateComposable,
  BoilerplateModule,
  BoilerplateScriptsLifecycleName,
} from './boilerplate/index.js';

const hasOwnProperty = Object.prototype.hasOwnProperty;

const require = createRequire(import.meta.url);

const resolve = EnhancedResolve.create.sync({
  conditionNames: ['node', 'require'],
});

export const MagicspaceBoilerplateConfig = x.object({
  boilerplate: x.string,
  options: x.object({}),
});

export type MagicspaceBoilerplateConfig = x.TypeOf<
  typeof MagicspaceBoilerplateConfig
>;

export type MagicspaceConfig = {
  /**
   * Composable file entries to be resolved.
   */
  composables: BoilerplateComposable[];
  /**
   * Boilerplate lifecycle scripts.
   */
  scripts: MagicspaceConfigScripts;
};

export type MagicspaceConfigScripts = {
  postgenerate: MagicspaceConfigScript[];
};

export type MagicspaceConfigScript = {
  source: string;
  script: string;
};

export async function resolveMagicspaceBoilerplateConfig(
  magicspaceDir: string,
): Promise<{
  path: string;
  module: MagicspaceBoilerplateConfig | MagicspaceBoilerplateConfig[];
}> {
  const path = require.resolve(Path.join(magicspaceDir, 'boilerplate'));

  let module: MagicspaceBoilerplateConfig | MagicspaceBoilerplateConfig[];

  if (path.endsWith('.json')) {
    const jsonc = await readFile(path, 'utf8');
    module = JSON.parse(stripJSONComments(jsonc));
  } else {
    module = (await requireOrImport(path)).default;
  }

  return {path, module};
}

export async function resolveBoilerplateModule(
  specifier: string,
  dir: string,
): Promise<BoilerplateModule> {
  const dirs = [
    dir,
    Path.dirname(fileURLToPath(import.meta.url)), // fallback to magicspace installation location.
  ];

  let boilerplateModulePath: string | false | undefined;

  for (const dir of dirs) {
    try {
      boilerplateModulePath = resolve(dir, specifier);
      break;
    } catch {
      // ignore
    }
  }

  if (typeof boilerplateModulePath !== 'string') {
    throw new Error(
      `Cannot resolve boilerplate ${JSON.stringify(
        specifier,
      )} from ${JSON.stringify(Path.relative(process.cwd(), dir))}`,
    );
  }

  return await requireOrImport(boilerplateModulePath);
}

export async function resolveMagicspaceConfig(
  magicspaceDir: string,
  projectDir: string,
): Promise<MagicspaceConfig> {
  const {path: configPath, module: configExport} =
    await resolveMagicspaceBoilerplateConfig(magicspaceDir);

  const configs = Array.isArray(configExport) ? configExport : [configExport];

  const boilerplates: Boilerplate[] = [];

  const configDir = Path.dirname(configPath);

  for (const config of configs) {
    MagicspaceBoilerplateConfig.asserts(config);

    const {boilerplate: boilerplateSpecifier, options} = config;

    const {default: boilerplateBuilder, Options} =
      await resolveBoilerplateModule(boilerplateSpecifier, configDir);

    if (Options) {
      Options.asserts(options);
    }

    boilerplates.push(
      await boilerplateBuilder(options, {magicspaceDir, projectDir}),
    );
  }

  const aggregatedBoilerplateComposables: BoilerplateComposable[] = [];

  const aggregatedScriptsEntries = Object.entries({
    postgenerate: [],
  } satisfies MagicspaceConfigScripts) as [
    BoilerplateScriptsLifecycleName,
    MagicspaceConfigScript[],
  ][];

  for (const boilerplate of boilerplates) {
    extractBoilerplates(boilerplate);
  }

  const composables = _.uniq(aggregatedBoilerplateComposables);

  const scripts = Object.fromEntries(
    aggregatedScriptsEntries.map(([name, entries]) => [name, _.uniq(entries)]),
  ) as unknown as MagicspaceConfigScripts;

  return {
    composables,
    scripts,
  };

  function extractBoilerplates({
    extends: extendedBoilerplates,
    composables: boilerplateComposables,
    scripts: boilerplateScripts,
    filename,
  }: Boilerplate): void {
    if (extendedBoilerplates) {
      extendedBoilerplates = Array.isArray(extendedBoilerplates)
        ? extendedBoilerplates
        : [extendedBoilerplates];

      for (const extendedBoilerplate of extendedBoilerplates) {
        extractBoilerplates(extendedBoilerplate);
      }
    }

    if (boilerplateComposables) {
      aggregatedBoilerplateComposables.push(...boilerplateComposables);
    }

    if (boilerplateScripts) {
      for (const [name, aggregatedScriptEntries] of aggregatedScriptsEntries) {
        if (hasOwnProperty.call(boilerplateScripts, name)) {
          const script = boilerplateScripts[name];

          if (typeof script === 'string') {
            aggregatedScriptEntries.push({
              source: filename,
              script,
            });
          }
        }
      }
    }
  }
}

export function buildConfigSchema(Options: x.XTypeOfValue<object>): JSONSchema {
  return x
    .object({
      $schema: x.string,
      boilerplate: x.string,
      options: Options,
    })
    .exact()
    .toJSONSchema();
}
