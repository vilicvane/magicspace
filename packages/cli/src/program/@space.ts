import {
  Config,
  ConfigLogger,
  ConfigLoggerEvent,
  DEFAULT_EXTENSION_TO_FILE_TYPE_MAP,
  DEFAULT_FILE_OBJECT_CREATOR_MAP,
  Space,
  SpaceLogger,
  SpaceLoggerEvent,
  ValidateError,
  resolveTemplateConfig,
} from '@magicspace/core';
import Chalk from 'chalk';

const CONFIG_LOGGER: ConfigLogger = {
  info(event: ConfigLoggerEvent) {
    switch (event.type) {
      case 'resolve-template':
        log('config', 'info', `resolving template ${event.path}`);
        break;
    }
  },
};

const SPACE_LOGGER: SpaceLogger = {
  info(event: SpaceLoggerEvent) {
    switch (event.type) {
      case 'loaded-composable-module':
        log('space', 'info', `loaded composable module ${event.path}`);
        break;
    }
  },
  stdout(text) {
    process.stdout.write(Chalk.dim(text));
  },
  stderr(text) {
    process.stderr.write(Chalk.red(text));
  },
};

function log(type: 'config' | 'space', _level: 'info', message: string): void {
  let label = Chalk.blue(`[${type}]`);

  console.info(label, message);
}

export async function createDefaultSpace(
  projectDir: string,
  templateDir: string | undefined,
): Promise<Space> {
  let config: Config | undefined;

  if (typeof templateDir === 'string') {
    try {
      config = await resolveTemplateConfig(templateDir, {
        logger: CONFIG_LOGGER,
      });
    } catch (error) {
      if (error instanceof ValidateError) {
        // eslint-disable-next-line no-throw-literal
        throw `Error validating template options:
${error.diagnostics.join('\n').replace(/^(?=.)/gm, '  ')}`;
      } else {
        throw error;
      }
    }
  }

  return new Space(
    DEFAULT_FILE_OBJECT_CREATOR_MAP,
    DEFAULT_EXTENSION_TO_FILE_TYPE_MAP,
    projectDir,
    config,
    SPACE_LOGGER,
  );
}
