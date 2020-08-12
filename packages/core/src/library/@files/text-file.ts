import {File} from '../file';

export interface TextFileOptions {}

export class TextFile extends File.File<string, TextFileOptions> {
  private content = '';

  compose(composable: File.Composable<string, TextFileOptions>): void {
    this.content = composable.compose(this.content, this.context);
  }

  toBuffer(): Buffer {
    return Buffer.from(this.content, 'utf8');
  }
}
