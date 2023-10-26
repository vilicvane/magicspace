import * as FS from 'fs';
import * as Path from 'path';

import type {
  MagicspaceConfig,
  SpaceLogger,
  SpaceLoggerEvent,
} from '@magicspace/core';
import {
  DEFAULT_EXTENSION_TO_FILE_TYPE_MAP,
  DEFAULT_FILE_OBJECT_CREATOR_MAP,
  Space,
  resolveMagicspaceConfig,
  x,
} from '@magicspace/core';
import Chalk from 'chalk';

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
  magicspaceDir: string,
): Promise<'magicspace-dir-not-exists' | Space>;
export async function createDefaultSpace(
  projectDir: string,
  magicspaceDir?: string,
): Promise<'magicspace-dir-not-exists' | Space> {
  let config: MagicspaceConfig | undefined;

  if (typeof magicspaceDir === 'string') {
    try {
      magicspaceDir = Path.resolve(magicspaceDir);

      if (!FS.existsSync(magicspaceDir)) {
        return 'magicspace-dir-not-exists';
      }

      config = await resolveMagicspaceConfig(magicspaceDir, projectDir);
    } catch (error) {
      if (error instanceof x.TypeConstraintError) {
        throw `Error validating boilerplate options:\n${error.message}`;
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
