import {ITemplateSourceConfig} from '../../config';

abstract class TemplateSourceFile<
  TConfig extends ITemplateSourceConfig,
  TContent = unknown
> {
  constructor(readonly path: string) {}

  abstract get(config: TConfig): TContent;
}

export const AbstractTemplateSourceFile = TemplateSourceFile;

export interface ITemplateSourceFile<
  TConfig extends ITemplateSourceConfig = ITemplateSourceConfig,
  TContent = unknown
> extends TemplateSourceFile<TConfig, TContent> {}
