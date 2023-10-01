import * as Path from 'path';

import {
  buildConfigSchema,
  resolveBoilerplateModule,
  resolveMagicspaceBoilerplateConfig,
} from '@magicspace/core';
import {Command, ExpectedError, command, metadata, param} from 'clime';
import * as FSExtra from 'fs-extra';

import {CommonOptions} from '../@command';
import {CONFIG_SCHEMA_FILE_NAME} from '../@constants';

@command({
  description: 'Update magicspace config schema',
})
export default class extends Command {
  @metadata
  async execute(
    @param({
      default: '.',
    })
    projectDir: string,
    options: CommonOptions,
  ): Promise<string> {
    const magicspaceDir = Path.resolve(projectDir, options.magicspace);

    const {module: configExport} =
      await resolveMagicspaceBoilerplateConfig(magicspaceDir);

    if (Array.isArray(configExport)) {
      throw new ExpectedError(
        'JSON schema update is not supported for multi-boilerplate config',
      );
    }

    const {boilerplate} = configExport;

    const {Options} = await resolveBoilerplateModule(
      boilerplate,
      magicspaceDir,
    );

    if (Options) {
      const configSchemaPath = Path.join(
        magicspaceDir,
        CONFIG_SCHEMA_FILE_NAME,
      );

      await FSExtra.outputFile(
        configSchemaPath,
        JSON.stringify(buildConfigSchema(Options), undefined, 2),
      );

      return 'JSON schema updated.';
    } else {
      return `Options X-Type is not defined for boilerplate ${JSON.stringify(
        boilerplate,
      )}`;
    }
  }
}
