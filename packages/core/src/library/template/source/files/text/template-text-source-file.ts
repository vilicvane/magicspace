import * as FS from 'fs';

import {TemplateTextSourceConfig} from '../../../../config';
import {AbstractTemplateSourceFile} from '../../template-source-file';

export class TemplateTextSourceFile extends AbstractTemplateSourceFile<
  TemplateTextSourceConfig,
  string
> {
  get({encoding = 'utf8'}: TemplateTextSourceConfig): string {
    return FS.readFileSync(this.path, encoding);
  }
}
