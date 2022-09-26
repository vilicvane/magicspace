import * as FS from 'fs';
import * as Path from 'path';

import type {
  Config,
  ConfigLogger,
  ConfigLoggerEvent,
  SpaceLogger,
  SpaceLoggerEvent,
} from '@magicspace/core';
import {
  DEFAULT_EXTENSION_TO_FILE_TYPE_MAP,
  DEFAULT_FILE_OBJECT_CREATOR_MAP,
  Space,
  ValidateError,
  resolveBoilerplateConfig,
} from '@magicspace/core';
import Chalk from 'chalk';

const CONFIG_LOGGER: ConfigLogger = {
  info(event: ConfigLoggerEvent) {
    switch (event.type) {
      case 'resolve-boilerplate':
        log('config', 'info', `resolving boilerplate ${event.path}`);
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
      case 'run-lifecycle-script':
        log(
          'space',
          'info',
          `run ${event.lifecycle} script ${JSON.stringify(event.script)}`,
        );
        break;
    }
  },
  stdout(data) {
    process.stdout.write(data);
  },
  stderr(data) {
    process.stderr.write(data);
  },
};

function log(type: 'config' | 'space', _level: 'info', message: string): void {
  const prefix = Chalk.blue(`[${type}] `);

  console.info(message.replace(/^/gm, prefix));
}

export async function createDefaultSpace(projectDir: string): Promise<Space>;
export async function createDefaultSpace(
  projectDir: string,
  boilerplateDir: string,
): Promise<'boilerplate-dir-not-exists' | Space>;
export async function createDefaultSpace(
  projectDir: string,
  boilerplateDir?: string,
): Promise<'boilerplate-dir-not-exists' | Space> {
  let config: Config | undefined;

  if (typeof boilerplateDir === 'string') {
    try {
      boilerplateDir = Path.resolve(boilerplateDir);

      if (!FS.existsSync(boilerplateDir)) {
        return 'boilerplate-dir-not-exists';
      }

      config = await resolveBoilerplateConfig(
        boilerplateDir,
        // The context file name does not matter as the boilerplate specifier is a
        // full path.
        Path.join(process.cwd(), '__placeholder__'),
        {
          logger: CONFIG_LOGGER,
        },
      );
    } catch (error) {
      if (error instanceof ValidateError) {
        // eslint-disable-next-line no-throw-literal
        throw `Error validating boilerplate options:
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
