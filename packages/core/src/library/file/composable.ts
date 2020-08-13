import {Context} from './context';

export interface Composable<
  TContent,
  TOptions,
  TMetadata extends object = object
> {
  type?: string;
  path?: string;
  compose: ComposeFunction<this, TContent, TMetadata>;
  /**
   * Composable file options.
   */
  options?: TOptions;
}

export type ComposeFunction<TThis, TContent, TMetadata extends object> = (
  this: TThis,
  content: TContent | undefined,
  context: Context<TMetadata>,
) => TContent;

/**
 * A utility function that returns the givin composable as-is.
 */
export function composable<
  TContent,
  TOptions,
  TMetadata extends object = object
>(
  composable: Composable<TContent, TOptions, TMetadata>,
): Composable<TContent, TOptions, TMetadata> {
  return composable;
}
