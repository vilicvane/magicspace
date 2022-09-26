import * as FSExtra from 'fs-extra';

import type {Composable} from './composable';

export abstract class File<TContent, TComposeOptions> {
  abstract content: TContent;

  composables: Composable<TContent, TComposeOptions>[] = [];

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
    composable: Composable<TContent, TComposeOptions>,
    context: FileComposeContext,
  ): Promise<void> {
    this.composables.push(composable);
    this.content = await composable.compose(this.content, {
      file: this,
      ...this.context,
      ...context,
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
