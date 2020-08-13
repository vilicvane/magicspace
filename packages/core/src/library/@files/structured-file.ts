import {File} from '../file';

export interface StructuredFileOptions {}

export abstract class StructuredFile<
  TContent,
  TOptions extends StructuredFileOptions
> extends File.File<TContent, TOptions> {
  protected abstract stringify(content: TContent): string;

  toText(): string {
    return this.stringify(this.content);
  }
}
