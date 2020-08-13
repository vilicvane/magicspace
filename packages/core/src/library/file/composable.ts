import {File} from './file';

export interface Composable<TContent, TOptions> {
  type?: string;
  path?: string;
  compose: ComposeFunction<File<TContent, TOptions>>;
  /**
   * Composable file options.
   */
  options?: TOptions;
}

export interface ComposeContext<TFile extends File<any, any>> {
  file: TFile;
  possibleOutputPath: string;
  composableModulePath: string;
}

export type ComposeFunction<TFile extends File<any, any>> = (
  content: TFile extends File<infer TContent, any> ? TContent : never,
  ComposeContext: ComposeContext<TFile>,
) => TFile extends File<infer TContent, any>
  ? Promise<TContent> | TContent
  : never;

/**
 * A utility function that returns the givin composable as-is.
 */
export function composable<TFile extends File<any, any>>(
  composable: TFile extends File<infer TContent, infer TOptions>
    ? Composable<TContent, TOptions>
    : never,
): TFile extends File<infer TContent, infer TOptions>
  ? Composable<TContent, TOptions>
  : never {
  return composable;
}
