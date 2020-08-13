import {File} from '../file';

export interface BinaryFileOptions {}

export class BinaryFile extends File.File<Buffer, BinaryFileOptions> {
  content = Buffer.alloc(0);

  toBuffer(): Buffer {
    return this.content;
  }
}
