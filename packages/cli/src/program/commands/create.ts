import * as Path from 'path';

import type {BoilerplateExample} from '@magicspace/core';
import {
  DEFAULT_MAGICSPACE_DIRNAME,
  buildConfigSchema,
  resolveBoilerplateModule,
} from '@magicspace/core';
import Chalk from 'chalk';
import {
  Command,
  ExpectedError,
  Options,
  command,
  metadata,
  option,
  param,
} from 'clime';
import * as FSExtra from 'fs-extra';
import prompts from 'prompts';

import {CONFIG_SCHEMA_FILE_NAME} from '../@constants';

export class CreateOptions extends Options {
  @option({
    toggle: true,
    description: 'Generate JSON schema for boilerplate.json',
    default: false,
  })
  schema!: boolean;
}

@command({
  description: 'Create magicspace config file',
})
export default class extends Command {
  @metadata
  async execute(
    @param({
      description: 'Boilerplate specifier',
      required: true,
    })
    boilerplate: string,
    {schema: toGenerateJSONSchema}: CreateOptions,
  ): Promise<string | void> {
    const magicspaceDir = Path.resolve(DEFAULT_MAGICSPACE_DIRNAME);

    if (FSExtra.existsSync(magicspaceDir)) {
      throw new ExpectedError(
        `Folder ${JSON.stringify(DEFAULT_MAGICSPACE_DIRNAME)} already exists`,
      );
    }

    const {examples, Options} = resolveBoilerplateModule(
      boilerplate,
      process.cwd(),
    );

    let example: BoilerplateExample | undefined;

    if (examples && examples.length > 1) {
      example = (
        await prompts({
          type: 'select',
          name: 'example',
          message: 'Select a boilerplate example configuration',
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
      example = examples?.[0];
    }

    const configFilePath = Path.join(magicspaceDir, 'boilerplate.json');

    const extendsSpecifier = /^[.]{1,2}[\\/]/.test(boilerplate)
      ? Path.relative(magicspaceDir, Path.resolve(boilerplate)).replace(
          /\\/g,
          '/',
        )
      : boilerplate;

    await FSExtra.outputFile(
      configFilePath,
      `${JSON.stringify(
        {
          ...(toGenerateJSONSchema
            ? {$schema: CONFIG_SCHEMA_FILE_NAME}
            : undefined),
          boilerplate: extendsSpecifier,
          options: example?.options ?? {},
        },
        undefined,
        2,
      )}\n`,
    );

    if (toGenerateJSONSchema && Options) {
      const configSchemaPath = Path.join(
        magicspaceDir,
        CONFIG_SCHEMA_FILE_NAME,
      );

      await FSExtra.outputFile(
        configSchemaPath,
        JSON.stringify(buildConfigSchema(Options), undefined, 2),
      );
    }

    return `\
Created magicspace configuration at ${JSON.stringify(
      Path.relative('.', configFilePath),
    )}.
Please review/edit the configuration file and run ${Chalk.yellow(
      'magicspace init',
    )} to initialize.`;
  }
}
