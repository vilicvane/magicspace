import {File} from '../file';

import {Context} from './context';

export type ComposableModuleDefault =
  | File.Composable<unknown, unknown>
  | File.Composable<unknown, unknown>[]
  | undefined
  | ComposableModuleFunction;

export type ComposableModuleFunction = (
  options: Magicspace.TemplateOptions,
  context: Context,
) =>
  | File.Composable<unknown, unknown>
  | File.Composable<unknown, unknown>[]
  | undefined extends infer TReturn
  ? Promise<TReturn> | TReturn
  : never;
