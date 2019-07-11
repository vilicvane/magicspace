import * as FSE from 'fs-extra';

import {TemplateTextDestinationConfig} from '../../../config';
import {AbstractTemplateDestinationFile} from '../template-destination-file';

export class TemplateTextDestinationFile extends AbstractTemplateDestinationFile<
  TemplateTextDestinationConfig
> {
  private text: string | undefined;
  private encoding: string | undefined;

  update(
    content: unknown,
    {encoding = 'utf8', mergeStrategy = 'error'}: TemplateTextDestinationConfig,
  ): void {
    let text = String(content);

    if (typeof this.text === 'string') {
      switch (mergeStrategy) {
        case 'error':
          throw new Error(
            `Content for text destination file ${JSON.stringify(
              this.path,
            )} already exist (merge strategy "error")`,
          );
        case 'ignore':
          return;
        case 'replace':
          this.text = text;
          break;
        case 'append':
          if (!this.text.includes(text)) {
            this.text += text;
          }

          break;
        case 'prepend':
          if (!this.text.includes(text)) {
            this.text = text + this.text;
          }

          break;
      }
    } else {
      this.text = text;
      this.encoding = encoding;
    }
  }

  flush(): void {
    FSE.outputFileSync(this.path, this.text, {
      encoding: this.encoding,
    });
  }
}
