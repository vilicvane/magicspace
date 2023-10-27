import {fileURLToPath} from 'url';

import getCallerFile from 'get-caller-file';
import type * as x from 'x-value';

import type {BoilerplateComposable} from './composables.js';

export type BoilerplateModule<TOptions extends object = object> = {
  Options?: x.XTypeOfValue<TOptions>;
  examples?: BoilerplateExample<TOptions>[];
  default: BoilerplateBuilder<TOptions>;
};

export type BoilerplateOptions = {
  extends?: Boilerplate | Boilerplate[];
  composables?: BoilerplateComposable[];
  scripts?: BoilerplateScripts;
};

export type Boilerplate = {
  filename: string;
} & BoilerplateOptions;

export type BoilerplateScripts = {
  postgenerate?: string;
};

export type BoilerplateScriptsLifecycleName = keyof BoilerplateScripts;

export type BoilerplateExample<TOptions extends object = object> = {
  name: string;
  description?: string;
  options?: TOptions;
};

export type BoilerplateBuilderContext = {
  magicspaceDir: string;
  projectDir: string;
};

export type BoilerplateCallback<TOptions extends object> = (
  options: TOptions,
  context: BoilerplateBuilderContext,
) => Promise<BoilerplateOptions>;

export type BoilerplateBuilder<TOptions extends object> = (
  options: TOptions,
  context: BoilerplateBuilderContext,
) => Promise<Boilerplate>;

export function boilerplate<TOptions extends object>(
  builder: BoilerplateCallback<TOptions>,
): BoilerplateBuilder<TOptions> {
  let filename = getCallerFile();

  try {
    filename = fileURLToPath(filename);
  } catch {
    // ignore
  }

  return async (...args) => ({
    filename,
    ...(await builder(...args)),
  });
}
