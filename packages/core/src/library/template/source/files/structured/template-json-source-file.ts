import * as FS from 'fs';

import stripJSONComments from 'strip-json-comments';

import {TemplateJSONSourceConfig} from '../../../../config';

import {AbstractTemplateStructuredSourceFile} from './template-structured-source-file';

export class TemplateJSONSourceFile extends AbstractTemplateStructuredSourceFile<
  TemplateJSONSourceConfig
> {
  protected load(): unknown {
    let jsonc = FS.readFileSync(this.path, 'utf8');
    let json = stripJSONComments(jsonc);

    return JSON.parse(json);
  }
}
