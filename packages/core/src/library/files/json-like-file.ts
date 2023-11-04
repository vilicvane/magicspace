import type {JSONFileOptions} from './json-file.js';
import {StructuredFile} from './structured-file.js';

export type JSONLikeFileOptions = JSONFileOptions & {
  before?: string;
  after?: string;
};

export class JSONLikeFile<TContent> extends StructuredFile<
  TContent | undefined,
  JSONLikeFileOptions
> {
  content: TContent | undefined;

  protected stringify(content: TContent | undefined): string {
    const {space = 2, before = '', after = ''} = this.options;

    return `${before}${JSON.stringify(content, undefined, space)}${after}`;
  }
}
