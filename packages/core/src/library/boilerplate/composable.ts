import type {Composable, File} from '../file/index.js';

export type ComposableModuleDefault =
  | Composable
  | Composable[]
  | undefined
  | ComposableBuilder;

export type ComposableBuilder<
  TOptions extends object = object,
  TFile extends File = File,
> = (
  options: TOptions,
) =>
  | Composable<TFile>
  | Composable<TFile>[]
  | undefined
  | Promise<Composable<TFile> | Composable<TFile>[] | undefined>;

/**
 * A utility function that returns the givin composable / composable module function as-is.
 */
export function composable<TFile extends File>(
  composable: Composable<TFile>,
): Composable<TFile>;
export function composable<TOptions extends object, TFile extends File = File>(
  builder: ComposableBuilder<TOptions, TFile>,
): ComposableBuilder<TOptions, TFile>;
export function composable(
  composable: Composable | ComposableBuilder,
): Composable | ComposableBuilder {
  return composable;
}
