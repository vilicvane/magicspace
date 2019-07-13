import {ITemplateDestinationConfig} from '../../config';

abstract class TemplateDestinationFile<
  TConfig extends ITemplateDestinationConfig
> {
  constructor(readonly path: string) {}

  abstract update(content: unknown, config: TConfig): void;

  abstract flush(): Promise<void> | void;
}

export const AbstractTemplateDestinationFile = TemplateDestinationFile;

export interface ITemplateDestinationFile<
  TConfig extends ITemplateDestinationConfig = ITemplateDestinationConfig
> extends TemplateDestinationFile<TConfig> {}
