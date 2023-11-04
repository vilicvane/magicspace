import type {FileObjectCreator} from '../space/index.js';

import type {File, FileGenerics} from './file.js';

export type Composable<TFile extends FileGenerics = FileGenerics> = {
  type?: string;
  path?: string;
  file?: FileObjectCreator;
  compose: ComposeFunction<TFile>;
  options?: TFile['TComposeOptions'];
};

export type ComposeContext<TFile extends FileGenerics> = {
  file: File<TFile['TContent'], TFile['TComposeOptions']>;
  outputPath: string;
  composableModulePath: string;
};

export type ComposeFunction<TFile extends FileGenerics> = {
  bivirance(
    content: TFile['TContent'],
    ComposeContext: ComposeContext<TFile>,
  ): TFile['TContent'] | Promise<TFile['TContent']>;
}['bivirance'];
