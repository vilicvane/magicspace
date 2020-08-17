import * as Path from 'path';

import {
  DEFAULT_MAGICSPACE_TEMPLATE_DIRNAME,
  resolveRawTemplateConfig,
} from '@magicspace/core';
import {Command, ExpectedError, command, metadata, param} from 'clime';
import * as FSExtra from 'fs-extra';
import prompts from 'prompts';

@command({
  description: 'Create magicspace config file',
})
export default class extends Command {
  @metadata
  async execute(
    @param({
      description: 'Template specifier',
      required: true,
    })
    template: string,
  ): Promise<string | void> {
    let magicspaceDir = Path.resolve(DEFAULT_MAGICSPACE_TEMPLATE_DIRNAME);

    if (FSExtra.existsSync(magicspaceDir)) {
      throw new ExpectedError(
        `Folder ${JSON.stringify(
          DEFAULT_MAGICSPACE_TEMPLATE_DIRNAME,
        )} already exists`,
      );
    }

    let {examples} = resolveRawTemplateConfig(template);

    let example: Magicspace.DefaultExampleOptions | Magicspace.ExampleOptions;

    if (examples && examples.length > 1) {
      example = (
        await prompts({
          type: 'select',
          name: 'example',
          message: 'Select a template example configuration',
          instructions: false,
          choices: examples.map(example => {
            return {
              title: example.name ?? 'default',
              description: example.description,
              value: example,
            };
          }),
        })
      ).example;

      if (!example) {
        return;
      }
    } else {
      example = examples?.[0] ?? {};
    }

    let configFilePath = Path.join(magicspaceDir, 'template.json');

    let extendsSpecifier = /^[.]{1,2}[\\/]/.test(template)
      ? Path.relative(magicspaceDir, Path.resolve(template)).replace(/\\/g, '/')
      : template;

    await FSExtra.outputFile(
      configFilePath,
      `${JSON.stringify(
        {
          extends: extendsSpecifier,
          options: example.options,
        },
        undefined,
        2,
      )}\n`,
    );

    return `\
Created magicspace configuration at ${JSON.stringify(
      Path.relative('.', configFilePath),
    )}.
Please review/edit the configuration file and run \`magicspace init\` to initialize.`;
  }
}
