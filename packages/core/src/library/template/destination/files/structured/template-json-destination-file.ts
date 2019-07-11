import {TemplateJSONDestinationConfig} from '../../../../config';

import {AbstractTemplateStructuredDestinationFile} from './template-structured-destination-file';

export class TemplateJSONDestinationFile extends AbstractTemplateStructuredDestinationFile<
  TemplateJSONDestinationConfig
> {
  protected parse(text: string): unknown {
    return JSON.parse(text);
  }

  protected stringify(object: unknown): string {
    return JSON.stringify(object, undefined, 2);
  }
}
