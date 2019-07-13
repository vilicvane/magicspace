import * as FS from 'fs';

import {TemplateBlobSourceConfig} from '../../../config';
import {AbstractTemplateSourceFile} from '../template-source-file';

export class TemplateBlobSourceFile extends AbstractTemplateSourceFile<
  TemplateBlobSourceConfig,
  Buffer
> {
  get(): Buffer {
    return FS.readFileSync(this.path);
  }
}
