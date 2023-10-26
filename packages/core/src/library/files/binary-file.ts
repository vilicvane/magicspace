import type {FileContext} from '../file/index.js';
import {File} from '../file/index.js';

export type BinaryFileOptions = {};

export class BinaryFile extends File<Buffer, BinaryFileOptions> {
  content = Buffer.alloc(0);

  constructor(path: string, context: FileContext) {
    super('binary', path, context);
  }

  override toBuffer(): Buffer {
    return this.content;
  }
}
