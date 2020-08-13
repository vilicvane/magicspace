import {File} from '../file';

export interface TextFileOptions {}

export class TextFile extends File.File<string, TextFileOptions> {
  content = '';

  constructor(path: string, possiblePathInProject: string) {
    super('text', path, possiblePathInProject);
  }

  toText(): string {
    return this.content;
  }
}
