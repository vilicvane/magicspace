import * as FS from 'fs';

import Handlebars from 'handlebars';

import {removePathExtension} from '../@utils.js';
import type {FileContext} from '../file/index.js';

import type {StructuredFileOptions} from './structured-file.js';
import {StructuredFile} from './structured-file.js';

export type HandlebarsFileOptions = {
  template?: string;
  noEscape?: boolean;
} & StructuredFileOptions;

export class HandlebarsFile<TContent> extends StructuredFile<
  TContent | undefined,
  HandlebarsFileOptions
> {
  content: TContent | undefined;

  constructor(path: string, context: FileContext) {
    super('handlebars', path, context);
  }

  protected stringify(content: TContent | undefined): string {
    const {template: explicitTemplate, noEscape} = this.options;

    const lastComposable = this.composables[this.composables.length - 1];

    const template =
      explicitTemplate ?? `${removePathExtension(lastComposable.source)}.hbs`;

    const templateContent = FS.readFileSync(template, 'utf8');

    return Handlebars.compile(templateContent, {noEscape})(content);
  }
}
