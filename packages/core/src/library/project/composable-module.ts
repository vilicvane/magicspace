import {File} from '../file';

import {Context} from './context';

export type ComposableModule =
  | File.Composable<unknown, unknown>
  | File.Composable<unknown, unknown>[]
  | ComposableModuleFunction;

export type ComposableModuleFunction = (
  options: Magicspace.TemplateOptions,
  context: Context,
) =>
  | File.Composable<unknown, unknown>
  | File.Composable<unknown, unknown>[] extends infer TReturn
  ? Promise<TReturn> | TReturn
  : never;
