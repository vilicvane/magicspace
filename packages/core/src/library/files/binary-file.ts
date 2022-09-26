import type {FileContext} from '../file';
import {File} from '../file';

export interface BinaryFileOptions {}

export class BinaryFile extends File<Buffer, BinaryFileOptions> {
  content = Buffer.alloc(0);

  constructor(path: string, context: FileContext) {
    super('binary', path, context);
  }

  override toBuffer(): Buffer {
    return this.content;
  }
}
