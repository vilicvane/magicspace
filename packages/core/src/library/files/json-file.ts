import {FileContext} from '../file';

import {StructuredFile, StructuredFileOptions} from './structured-file';

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
    let {space} = this.options;

    return JSON.stringify(content, undefined, space);
  }
}
