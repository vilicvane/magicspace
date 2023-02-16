import * as FSExtra from 'fs-extra';

import type {BoilerplateComposable} from '../boilerplate';

export abstract class File<TContent = unknown, TComposeOptions = unknown> {
  abstract content: TContent;

  composables: BoilerplateComposable<File<TContent, TComposeOptions>>[] = [];

  /**
   * Shallowly merged options from composables.
   */
  get options(): TComposeOptions {
    return Object.assign(
      {},
      ...this.composables.map(composable => composable.options),
    );
  }

  constructor(
    readonly type: string,
    readonly path: string,
    readonly context: FileContext,
  ) {}

  async compose(
    composable: BoilerplateComposable<File<TContent, TComposeOptions>>,
  ): Promise<void> {
    this.composables.push(composable);

    this.content = await composable.compose(this.content, {
      file: this,
      composableModulePath: composable.source,
      ...this.context,
    });
  }

  toText?(): string;

  toBuffer?(): Buffer;

  async save(): Promise<void> {
    let content: string | Buffer;

    if (this.toText) {
      content = this.toText();
    } else if (this.toBuffer) {
      content = this.toBuffer();
    } else {
      throw new Error(
        'Invalid composable file, either `toText()` or `toBuffer()` must be implemented',
      );
    }

    FSExtra.outputFileSync(this.path, content);
  }
}

export interface FileContext {
  possibleOutputPath: string;
}

export interface FileComposeContext {
  composableModulePath: string;
}

export type FileContent<TFile extends File> = TFile extends File<infer TContent>
  ? TContent
  : never;

export type FileOptions<TFile extends File> = TFile extends File<
  unknown,
  infer TOptions
>
  ? TOptions
  : never;
