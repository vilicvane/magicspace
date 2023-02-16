import type {Composable, File} from '../file';

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
): typeof composable;
export function composable<TOptions extends object, TFile extends File = File>(
  builder: ComposableBuilder<TOptions, TFile>,
): typeof composable;
export function composable(
  composable: Composable | ComposableBuilder,
): typeof composable {
  return composable;
}
