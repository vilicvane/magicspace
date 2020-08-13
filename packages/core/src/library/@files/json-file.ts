import {StructuredFile, StructuredFileOptions} from './structured-file';

export interface JSONFileOptions extends StructuredFileOptions {}

export class JSONFile<TContent> extends StructuredFile<
  TContent,
  JSONFileOptions
> {
  protected stringify(content: TContent | undefined): string {
    return JSON.stringify(content, undefined, 2);
  }
}
