import {StructuredFile, StructuredFileOptions} from './structured-file';

export interface JSONFileOptions extends StructuredFileOptions {}

export class JSONFile<TContent> extends StructuredFile<
  TContent | undefined,
  JSONFileOptions
> {
  content: TContent | undefined;

  constructor(path: string, possiblePathInProject: string) {
    super('json', path, possiblePathInProject);
  }

  protected stringify(content: TContent | undefined): string {
    return JSON.stringify(content, undefined, 2);
  }
}
