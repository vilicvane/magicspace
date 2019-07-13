import {
  ProjectConfig,
  TemplateBundleConfig,
  TemplateModuleSourceCallback,
} from './config';

export function project(config: ProjectConfig): ProjectConfig {
  return config;
}

export function bundle(config: TemplateBundleConfig): TemplateBundleConfig {
  return config;
}

export function source<TOptions extends object>(
  callback: TemplateModuleSourceCallback<TOptions>,
): TemplateModuleSourceCallback {
  return callback;
}
