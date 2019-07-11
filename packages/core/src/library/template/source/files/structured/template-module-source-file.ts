import {requireDefault} from '../../../../@utils';
import {
  SOURCE_HELPERS,
  TemplateModuleSourceCallback,
  TemplateModuleSourceConfig,
} from '../../../../config';

import {AbstractTemplateStructuredSourceFile} from './template-structured-source-file';

export class TemplateModuleSourceFile extends AbstractTemplateStructuredSourceFile<
  TemplateModuleSourceConfig
> {
  protected load({options = {}}: TemplateModuleSourceConfig): unknown {
    let module = requireDefault<TemplateModuleSourceCallback | unknown>(
      this.path,
    );

    return typeof module === 'function'
      ? module(options, SOURCE_HELPERS)
      : module;
  }
}
