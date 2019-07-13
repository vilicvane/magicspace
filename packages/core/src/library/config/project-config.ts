import {TemplateBundleConfig} from './template-bundle-config';

export interface ProjectConfig extends TemplateBundleConfig {
  name: string;
  path?: string;
}
