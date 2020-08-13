import {File} from '../file';

export interface BinaryFileOptions {}

export class BinaryFile extends File.File<Buffer, BinaryFileOptions> {
  content = Buffer.alloc(0);

  constructor(path: string, context: File.FileContext) {
    super('binary', path, context);
  }

  toBuffer(): Buffer {
    return this.content;
  }
}
