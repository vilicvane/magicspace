import * as FSE from 'fs-extra';

import {TemplateBlobDestinationConfig} from '../../../config';
import {AbstractTemplateDestinationFile} from '../template-destination-file';

export class TemplateBlobDestinationFile extends AbstractTemplateDestinationFile<
  TemplateBlobDestinationConfig
> {
  private blob: Buffer | undefined;

  update(
    content: unknown,
    {mergeStrategy = 'error'}: TemplateBlobDestinationConfig,
  ): void {
    if (this.blob) {
      switch (mergeStrategy) {
        case 'error':
          throw new Error(
            `Content for blob destination file ${JSON.stringify(
              this.path,
            )} already exist (merge strategy "error")`,
          );
        case 'ignore':
          return;
        case 'replace':
          break;
      }
    }

    this.blob =
      content instanceof Buffer
        ? content
        : Buffer.from(String(content), 'utf8');
  }

  flush(): void {
    FSE.outputFileSync(this.path, this.blob);
  }
}
