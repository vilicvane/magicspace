import type {FileContext} from '../file';

import type {StructuredFileOptions} from './structured-file';
import {StructuredFile} from './structured-file';

export interface JSONFileOptions extends StructuredFileOptions {
  space?: string | number;
}

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
