import type {FileContext} from '../file/index.js';

import type {StructuredFileOptions} from './structured-file.js';
import {StructuredFile} from './structured-file.js';

export type JSONFileOptions = {
  space?: string | number;
} & StructuredFileOptions;

export class JSONFile<TContent> extends StructuredFile<
  TContent | undefined,
  JSONFileOptions
> {
  content: TContent | undefined;

  constructor(path: string, context: FileContext) {
    super('json', path, context);
  }

  protected stringify(content: TContent | undefined): string {
    const {space = 2} = this.options;

    return JSON.stringify(content, undefined, space);
  }
}
