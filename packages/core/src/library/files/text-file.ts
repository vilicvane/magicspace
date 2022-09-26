import type {FileContext} from '../file';
import {File} from '../file';

export interface TextFileOptions {}

export class TextFile extends File<string, TextFileOptions> {
  content = '';

  constructor(path: string, context: FileContext) {
    super('text', path, context);
  }

  override toText(): string {
    return this.content;
  }
}
