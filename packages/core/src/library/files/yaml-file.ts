import * as YAML from 'yaml';

import type {FileContext} from '../file/index.js';

import type {StructuredFileOptions} from './structured-file.js';
import {StructuredFile} from './structured-file.js';

export type YAMLFileOptions = {
  space?: number;
} & StructuredFileOptions;

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
