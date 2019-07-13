import {Primitive} from 'tslang';

declare global {
  namespace Magicspace {
    interface TemplateBundleOptions {}
  }
}

export type TemplateBundleOptions = Partial<Magicspace.TemplateBundleOptions>;

export interface TemplateBundleConfig {
  workspace?: boolean;
  extends?: (string | TemplateBundleExtendConfig)[];
  templates?: TemplateConfig[] | TemplateConfigsCallback;
}

export interface TemplateBundleExtendConfig {
  name: string;
  options?: TemplateBundleOptions;
}

export interface TemplateConfigsCallbackContext {
  workspace: {
    path: string;
  };
  project: {
    name: string;
    path: string;
  };
}

export type TemplateConfigsCallback = (
  context: TemplateConfigsCallbackContext,
  options: TemplateBundleOptions,
  helpers: TemplateSourceHelpers,
) => TemplateConfig[];

export interface ITemplateConfig {
  source: Primitive | TemplateInlineSourceConfig | ITemplateSourceConfig;
  destination: ITemplateDestinationConfig;
}

export interface TemplateConfig extends ITemplateConfig {
  source: TemplateSourceConfig;
  destination: TemplateDestinationConfig;
}

////////////
// Source //
////////////

export class TemplateStructuredPlaceholder<T> {
  constructor(readonly value: T) {}
}

export interface TemplateSourceHelpers {
  placeholder<T>(value: T): TemplateStructuredPlaceholder<T>;
}

/** @internal */
export const SOURCE_HELPERS: TemplateSourceHelpers = {
  placeholder(value) {
    return new TemplateStructuredPlaceholder(value);
  },
};

export type TemplateModuleSourceCallback<TOptions extends object = object> = (
  options: TOptions,
  helpers: TemplateSourceHelpers,
) => unknown;

export type GeneralTemplateSourceConfig =
  | Primitive
  | TemplateInlineSourceConfig
  | ITemplateSourceConfig;

export interface ITemplateSourceConfig {
  type: string;
  placeholder?: string | boolean;
  filePath: string;
  options?: object;
}

export type TemplateSourceConfig =
  | string
  | TemplateInlineSourceConfig
  | TemplateJSONSourceConfig
  | TemplateModuleSourceConfig
  | TemplateHandlebarsSourceConfig
  | TemplateTextSourceConfig
  | TemplateBlobSourceConfig;

export interface TemplateInlineSourceConfig {
  type: 'inline';
  placeholder?: string | boolean;
  content: unknown;
}

export function isTemplateInlineSourceConfig(
  config: GeneralTemplateSourceConfig,
): config is TemplateInlineSourceConfig {
  return (
    typeof config === 'object' && config !== null && config.type === 'inline'
  );
}

export interface ITemplateStructuredSourceConfig extends ITemplateSourceConfig {
  propertyPath?: string | string[];
}

export interface TemplateJSONSourceConfig
  extends ITemplateStructuredSourceConfig {
  type: 'json';
}

export interface TemplateModuleSourceConfig
  extends ITemplateStructuredSourceConfig {
  type: 'module';
}

export interface ITemplateTextSourceConfig extends ITemplateSourceConfig {
  encoding?: string;
}

export interface TemplateTextSourceConfig extends ITemplateTextSourceConfig {
  type: 'text';
}

export interface TemplateHandlebarsSourceConfig
  extends ITemplateTextSourceConfig {
  type: 'handlebars';
}

export interface TemplateBlobSourceConfig extends ITemplateSourceConfig {
  type: 'blob';
}

/////////////////
// Destination //
/////////////////

export interface ITemplateDestinationConfig {
  type: string;
  filePath: string;
}

export type TemplateDestinationConfig =
  | TemplateJSONDestinationConfig
  | TemplateTextDestinationConfig
  | TemplateBlobDestinationConfig;

export type TemplateStructuredDestinationMergeStrategy =
  | 'error'
  | 'ignore'
  | 'replace'
  | 'shallow'
  | 'deep'
  | 'union'
  | 'concat';

export interface ITemplateStructuredDestinationConfig
  extends ITemplateDestinationConfig {
  propertyPath?: string | string[];
  mergeStrategy?: TemplateStructuredDestinationMergeStrategy;
  spread?: boolean;
  sort?: string[] | boolean;
}

export interface TemplateJSONDestinationConfig
  extends ITemplateStructuredDestinationConfig {
  type: 'json';
}

export type TemplateTextDestinationMergeStrategy =
  | 'error'
  | 'ignore'
  | 'replace'
  | 'append'
  | 'prepend';

export interface TemplateTextDestinationConfig
  extends ITemplateDestinationConfig {
  type: 'text';
  encoding?: string;
  mergeStrategy?: TemplateTextDestinationMergeStrategy;
}

export type TemplateBlobDestinationMergeStrategy =
  | 'error'
  | 'ignore'
  | 'replace';

export interface TemplateBlobDestinationConfig
  extends ITemplateDestinationConfig {
  type: 'blob';
  mergeStrategy?: TemplateBlobDestinationMergeStrategy;
}
