import {File, FileContext} from '../file';

export interface TextFileOptions {}

export class TextFile extends File<string, TextFileOptions> {
  content = '';

  constructor(path: string, context: FileContext) {
    super('text', path, context);
  }

  toText(): string {
    return this.content;
  }
}
