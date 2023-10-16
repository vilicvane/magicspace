import getCallerFile from 'get-caller-file';
import type * as x from 'x-value';

import type {BoilerplateComposable} from './composables';

export interface BoilerplateModule<TOptions extends object = object> {
  Options?: x.XTypeOfValue<TOptions>;
  examples?: BoilerplateExample<TOptions>[];
  default: BoilerplateBuilder<TOptions>;
}

export interface BoilerplateOptions {
  extends?: Boilerplate | Boilerplate[];
  composables?: BoilerplateComposable[];
  scripts?: BoilerplateScripts;
}

export interface Boilerplate extends BoilerplateOptions {
  filename: string;
}

export interface BoilerplateScripts {
  postgenerate?: string;
}

export type BoilerplateScriptsLifecycleName = keyof BoilerplateScripts;

export interface BoilerplateExample<TOptions extends object = object> {
  name: string;
  description?: string;
  options?: TOptions;
}

export interface BoilerplateBuilderContext {
  projectDir: string;
}

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
  const filename = getCallerFile();

  return async (...args) => ({
    filename,
    ...(await builder(...args)),
  });
}
