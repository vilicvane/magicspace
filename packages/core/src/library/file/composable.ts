import type {File, FileGenerics} from './file';

export interface Composable<TFile extends FileGenerics = FileGenerics> {
  type?: string;
  path?: string;
  compose: ComposeFunction<TFile>;
  options?: TFile['TComposeOptions'];
}

export interface ComposeContext<TFile extends FileGenerics> {
  file: File<TFile['TContent'], TFile['TComposeOptions']>;
  possibleOutputPath: string;
  composableModulePath: string;
}

export type ComposeFunction<TFile extends FileGenerics> = {
  bivirance(
    content: TFile['TContent'],
    ComposeContext: ComposeContext<TFile>,
  ): TFile['TContent'] | Promise<TFile['TContent']>;
}['bivirance'];
