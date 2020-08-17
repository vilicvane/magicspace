import {Composable} from '../file';

import {Context} from './context';

export type ComposableModuleDefault =
  | Composable<unknown, unknown>
  | Composable<unknown, unknown>[]
  | undefined
  | ComposableModuleFunction;

export type ComposableModuleFunction = (
  options: Magicspace.BoilerplateOptions,
  context: Context,
) =>
  | Composable<unknown, unknown>
  | Composable<unknown, unknown>[]
  | undefined extends infer TReturn
  ? Promise<TReturn> | TReturn
  : never;
