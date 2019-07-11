import * as Handlebars from 'handlebars';

import {TemplateTextSourceConfig} from '../../../../config';

import {TemplateTextSourceFile} from './template-text-source-file';

export class TemplateHandlebarsSourceFile extends TemplateTextSourceFile {
  get(config: TemplateTextSourceConfig): string {
    let templateText = super.get(config);

    let template = Handlebars.compile(templateText);

    let {options = {}} = config;

    return template(options);
  }
}
