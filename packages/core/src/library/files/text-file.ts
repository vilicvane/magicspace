import type {FileContext} from '../file/index.js';
import {File} from '../file/index.js';

export type TextFileOptions = {};

export class TextFile extends File<string, TextFileOptions> {
  content = '';

  constructor(path: string, context: FileContext) {
    super('text', path, context);
  }

  override toText(): string {
    return this.content;
  }
}
