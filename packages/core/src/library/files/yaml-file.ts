import * as YAML from 'yaml';

import type {FileContext} from '../file';

import type {StructuredFileOptions} from './structured-file';
import {StructuredFile} from './structured-file';

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
    const {space = 2} = this.options;

    return YAML.stringify(content, {indent: space});
  }
}
