import * as FSExtra from 'fs-extra';

import type {BoilerplateComposable} from '../boilerplate';

export interface FileGenerics<TContent = unknown, TComposeOptions = unknown> {
  TContent: TContent;
  TComposeOptions: TComposeOptions;
}

export abstract class File<TContent = unknown, TComposeOptions = unknown> {
  declare TContent: TContent;
  declare TComposeOptions: TComposeOptions;

  abstract content: TContent;

  composables: BoilerplateComposable<
    FileGenerics<TContent, TComposeOptions>
  >[] = [];

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
    composable: BoilerplateComposable<FileGenerics<TContent, TComposeOptions>>,
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
  outputPath: string;
}
