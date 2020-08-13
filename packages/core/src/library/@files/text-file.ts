import {File} from '../file';

export interface TextFileOptions {}

export class TextFile extends File.File<string, TextFileOptions> {
  content = '';

  toText(): string {
    return this.content;
  }
}
