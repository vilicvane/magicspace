import * as Path from 'path';

import * as FSE from 'fs-extra';
import * as Glob from 'glob';
import _ from 'lodash';
import resolve from 'resolve';

import {requireDefault} from './@utils';
import {
  GeneralTemplateSourceConfig,
  ITemplateDestinationConfig,
  ProjectConfig,
  SOURCE_HELPERS,
  TemplateBundleConfig,
  TemplateConfig,
  TemplateConfigsCallback,
  TemplateConfigsCallbackContext,
  isTemplateInlineSourceConfig,
} from './config';
import {ITemplateDestinationFile, ITemplateSourceFile} from './template';

const DEFAULT_MAGICSPACE_FOLDER_NAME = '.magicspace';

interface BuildTemplateBundleContext {
  templateBundleOptions: object;
  templateBundlePath: string;
  projectName: string;
  projectPath: string;
}

interface TemplateBundle {
  workspace: boolean;
  path: string;
  projectPath: string;
  projectName: string;
  templates: TemplateConfig[] | TemplateConfigsCallback;
  options: object;
  index: number;
}

export type TemplateSourceFileCreateCallback = (
  filePath: string,
) => ITemplateSourceFile;

export type TemplateDestinationFileCreateCallback = (
  filePath: string,
) => ITemplateDestinationFile;

export interface MagicspaceBuilderOptions {
  magicspacePath?: string;
}

export class MagicspaceBuilder {
  readonly workspacePath: string;
  readonly magicspacePath: string;

  private typeToTemplateSourceFileCreateCallbackMap = new Map<
    string,
    TemplateSourceFileCreateCallback
  >();

  private typeToTemplateDestinationFileCreateCallbackMap = new Map<
    string,
    TemplateDestinationFileCreateCallback
  >();

  private filePathToTemplateSourceFileMap = new Map<
    string,
    ITemplateSourceFile
  >();

  private filePathToTemplateDestinationFileMap = new Map<
    string,
    ITemplateDestinationFile
  >();

  private templateBundles: TemplateBundle[] = [];

  private templateBundleIndexCounter = 0;

  constructor(
    workspacePath: string,
    {
      magicspacePath = DEFAULT_MAGICSPACE_FOLDER_NAME,
    }: MagicspaceBuilderOptions = {},
  ) {
    this.workspacePath = Path.resolve(workspacePath);
    this.magicspacePath = Path.resolve(this.workspacePath, magicspacePath);
  }

  async build(): Promise<void> {
    let projectConfigPaths = Glob.sync('**/{project,*.project}.{js,ts,json}', {
      cwd: this.magicspacePath,
      absolute: true,
    });

    for (let projectConfigPath of projectConfigPaths) {
      this.resolveProject(projectConfigPath);
    }

    let workspacePath = this.workspacePath;

    let templateBundles = _.sortBy(this.templateBundles, [
      bundle => (bundle.workspace ? -1 : 1),
      bundle => bundle.index,
    ]);

    for (let {
      path: templateBundlePath,
      projectName,
      projectPath,
      templates: templateConfigs,
      options,
    } of templateBundles) {
      if (typeof templateConfigs === 'function') {
        let context: TemplateConfigsCallbackContext = {
          workspace: {
            path: workspacePath,
          },
          project: {
            name: projectName,
            path: projectPath,
          },
        };

        templateConfigs = templateConfigs(context, options, SOURCE_HELPERS);
      }

      for (let config of templateConfigs) {
        let [content, placeholder = false] = this.getSourceContent(
          config.source,
          templateBundlePath,
        );

        this.updateDestinationContent(
          content,
          config.destination,
          projectPath,
          placeholder,
        );
      }
    }

    await this.flushDestinationFiles();
  }

  registerSourceFile(
    type: string,
    callback: TemplateSourceFileCreateCallback,
  ): void {
    this.typeToTemplateSourceFileCreateCallbackMap.set(type, callback);
  }

  registerDestinationFile(
    type: string,
    callback: TemplateDestinationFileCreateCallback,
  ): void {
    this.typeToTemplateDestinationFileCreateCallbackMap.set(type, callback);
  }

  private getSourceContent(
    sourceConfig: GeneralTemplateSourceConfig,
    templateBundlePath: string,
  ): [unknown, string | boolean | undefined] {
    if (
      typeof sourceConfig !== 'object' ||
      sourceConfig === null ||
      !_.isPlainObject(sourceConfig)
    ) {
      return [sourceConfig, false];
    }

    if (isTemplateInlineSourceConfig(sourceConfig)) {
      return [sourceConfig.content, sourceConfig.placeholder];
    }

    let filePath = Path.resolve(
      Path.dirname(templateBundlePath),
      sourceConfig.filePath,
    );

    let file = this.filePathToTemplateSourceFileMap.get(filePath);

    if (!file) {
      let createCallback = this.typeToTemplateSourceFileCreateCallbackMap.get(
        sourceConfig.type,
      );

      if (!createCallback) {
        throw new Error(`Invalid template source type "${sourceConfig.type}"`);
      }

      file = createCallback(filePath);

      this.filePathToTemplateSourceFileMap.set(filePath, file);
    }

    return [file.get(sourceConfig), sourceConfig.placeholder];
  }

  private updateDestinationContent(
    content: unknown,
    config: ITemplateDestinationConfig,
    projectPath: string,
    placeholder: string | boolean,
  ): void {
    let filePath = resolveTemplateDestinationFilePath(config.filePath, {
      workspacePath: this.workspacePath,
      projectPath,
    });

    if (placeholder !== false) {
      let placeholderTestPath: string | undefined;

      if (typeof placeholder === 'string') {
        placeholderTestPath = resolveTemplateDestinationFilePath(placeholder, {
          workspacePath: this.workspacePath,
          projectPath,
        });
      } else {
        placeholderTestPath = filePath;
      }

      if (FSE.existsSync(placeholderTestPath)) {
        return;
      }
    }

    let file = this.filePathToTemplateDestinationFileMap.get(filePath);

    if (!file) {
      let createCallback = this.typeToTemplateDestinationFileCreateCallbackMap.get(
        config.type,
      );

      if (!createCallback) {
        throw new Error(`Invalid template destination type "${config.type}"`);
      }

      file = createCallback(filePath);

      this.filePathToTemplateDestinationFileMap.set(filePath, file);
    }

    file.update(content, config);
  }

  private async flushDestinationFiles(): Promise<void> {
    for (let file of this.filePathToTemplateDestinationFileMap.values()) {
      await file.flush();
    }
  }

  private resolveProject(projectConfigPath: string): void {
    let {name, path = '.', ...templateBundleConfig} = requireDefault<
      ProjectConfig
    >(projectConfigPath);

    path = Path.resolve(this.workspacePath, path);

    this.resolveTemplateBundle(templateBundleConfig, {
      templateBundleOptions: {},
      templateBundlePath: projectConfigPath,
      projectName: name,
      projectPath: path,
    });
  }

  private resolveTemplateBundle(
    {
      workspace = false,
      extends: extendConfigs = [],
      templates: templateConfigs = [],
    }: TemplateBundleConfig,
    {
      templateBundleOptions,
      templateBundlePath,
      projectName,
      projectPath,
    }: BuildTemplateBundleContext,
  ): void {
    let templateBundle = this.templateBundles.find(
      bundle =>
        bundle.path === templateBundlePath &&
        bundle.workspace === workspace &&
        (workspace || bundle.projectPath === projectPath),
    );

    if (!templateBundle) {
      templateBundle = {
        workspace,
        path: templateBundlePath,
        projectPath,
        projectName,
        templates: templateConfigs,
        options: {},
        index: 0,
      };

      this.templateBundles.push(templateBundle);
    }

    templateBundle.options = {
      ...templateBundleOptions,
      ...templateBundle.options,
    };

    for (let extendConfig of extendConfigs) {
      if (typeof extendConfig === 'string') {
        extendConfig = {
          name: extendConfig,
        };
      }

      let {name, options = {}} = extendConfig;

      let nestedTemplateBundleOptions = {
        ...templateBundleOptions,
        ...options,
      };

      let nestedTemplateBundlePath = resolve.sync(name, {
        basedir: Path.dirname(templateBundlePath),
        extensions: ['.js', '.ts', '.json'],
      });

      if (!nestedTemplateBundlePath) {
        throw new Error(`Cannot resolve template bundle "${name}"`);
      }

      let nestedTemplateBundleConfig = requireDefault<TemplateBundleConfig>(
        nestedTemplateBundlePath,
      );

      this.resolveTemplateBundle(nestedTemplateBundleConfig, {
        templateBundleOptions: nestedTemplateBundleOptions,
        templateBundlePath: nestedTemplateBundlePath,
        projectName,
        projectPath,
      });
    }

    if (!templateBundle.index) {
      templateBundle.index = ++this.templateBundleIndexCounter;
    }
  }
}

interface ResolveTemplateDestinationFilePathOptions {
  workspacePath: string;
  projectPath: string;
}

function resolveTemplateDestinationFilePath(
  filePath: string,
  {workspacePath, projectPath}: ResolveTemplateDestinationFilePathOptions,
): string {
  let matched = false;

  let fullFilePath = filePath.replace(
    /^<(workspace|project)>(?=\/|$)/,
    (_text, name) => {
      matched = true;

      if (name === 'workspace') {
        return workspacePath;
      } else {
        return projectPath;
      }
    },
  );

  if (!matched) {
    throw new Error(
      'Destination file path must be started with `<workspace>/` or `<project>/`',
    );
  }

  return fullFilePath;
}
