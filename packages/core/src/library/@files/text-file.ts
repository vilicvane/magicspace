import {File} from '../file';

export interface TextFileOptions {}

export class TextFile extends File.File<string, TextFileOptions> {
  content = '';

  constructor(path: string, context: File.FileContext) {
    super('text', path, context);
  }

  toText(): string {
    return this.content;
  }
}
