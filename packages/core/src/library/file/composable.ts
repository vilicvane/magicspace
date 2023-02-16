import type {File, FileContent, FileOptions} from './file';

export interface Composable<TFile extends File = File> {
  type?: string;
  path?: string;
  compose: ComposeFunction<TFile>;
  options?: FileOptions<TFile>;
}

export interface ComposeContext<TFile extends File> {
  file: TFile;
  possibleOutputPath: string;
  composableModulePath: string;
}

export type ComposeFunction<TFile extends File> = (
  content: FileContent<TFile>,
  ComposeContext: ComposeContext<TFile>,
) => FileContent<TFile> | Promise<FileContent<TFile>>;
