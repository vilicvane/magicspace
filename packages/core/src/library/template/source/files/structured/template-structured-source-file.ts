import _ from 'lodash';

import {ITemplateStructuredSourceConfig} from '../../../../config';
import {AbstractTemplateSourceFile} from '../../template-source-file';

abstract class TemplateStructuredSourceFile<
  TConfig extends ITemplateStructuredSourceConfig
> extends AbstractTemplateSourceFile<TConfig> {
  get(config: TConfig): unknown {
    let {propertyPath = []} = config;

    let object = this.load(config);

    return propertyPath.length ? _.get(object, propertyPath) : object;
  }

  protected abstract load(config: TConfig): unknown;
}

export const AbstractTemplateStructuredSourceFile = TemplateStructuredSourceFile;

export interface ITemplateStructuredSourceFile<
  TConfig extends ITemplateStructuredSourceConfig
> extends TemplateStructuredSourceFile<TConfig> {}
