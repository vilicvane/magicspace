import * as YAML from 'yaml';

import {FileContext} from '../file';

import {StructuredFile, StructuredFileOptions} from './structured-file';

export interface YAMLFileOptions extends StructuredFileOptions {
  space?: number;
}

export class YAMLFile<TContent> extends StructuredFile<
  TContent | undefined,
  YAMLFileOptions
> {
  content: TContent | undefined;

  constructor(path: string, context: FileContext) {
    super('yaml', path, context);
  }

  protected stringify(content: TContent | undefined): string {
    let {space = 2} = this.options;

    return YAML.stringify(content, {indent: space});
  }
}
