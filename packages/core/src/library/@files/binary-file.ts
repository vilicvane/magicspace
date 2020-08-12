import {File} from '../file';

export interface BinaryFileOptions {}

export class BinaryFile extends File.File<Buffer, BinaryFileOptions> {
  private content: Buffer | undefined = undefined;

  compose(composable: File.Composable<Buffer, BinaryFileOptions>): void {
    this.content = composable.compose(this.content, this.context);
  }

  toBuffer(): Buffer {
    return this.content!;
  }
}
