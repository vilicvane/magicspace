import {File} from '../file';

export interface StructuredFileOptions {}

export abstract class StructuredFile<
  TContent,
  TOptions extends StructuredFileOptions
> extends File.File<TContent, TOptions> {
  private content: TContent | undefined;

  protected abstract stringify(content: TContent | undefined): string;

  compose(composable: File.Composable<TContent, TOptions>): void {
    this.content = composable.compose(this.content, this.context);
  }

  toBuffer(): Buffer {
    let text = this.stringify(this.content);
    return Buffer.from(text, 'utf8');
  }
}
