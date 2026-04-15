import * as ChildProcess from 'child_process';
import {createRequire} from 'module';
import * as Path from 'path';
import {pathToFileURL} from 'url';

import FSExtra from 'fs-extra';
import npmPath from 'npm-path';
import {__importDefault} from 'tslib';

const require = createRequire(import.meta.url);

export class SpawnSyncFailure {
  constructor(
    readonly command: string,
    readonly args: string[],
    readonly cwd: string,
    readonly stdout: string,
    readonly stderr: string,
    readonly code: number | null,
  ) {}
}

export function spawnSync(
  cwd: string,
  command: string,
  args: string[],
): string {
  const {error, status, stdout, stderr} = ChildProcess.spawnSync(
    command,
    args,
    {
      cwd,
      encoding: 'utf8',
      env: {
        ...process.env,
        // Make sure Git write console in English
        // https://www.gnu.org/software/gettext/manual/html_node/Locale-Environment-Variables.html
        // https://www.gnu.org/software/gettext/manual/html_node/The-LANGUAGE-variable.html#The-LANGUAGE-variable
        LC_ALL: 'C',
      },
    },
  );

  if (error) {
    throw error;
  }

  if (status !== 0) {
    throw new SpawnSyncFailure(command, args, cwd, stdout, stderr, status);
  }

  return stdout;
}

export type NPMSpawnOptions = {
  pathCWD: string;
  cwd: string;
  shell?: boolean;
  args?: string[];
};

export async function npmSpawn(
  script: string,
  {pathCWD, cwd, args = [], shell = false}: NPMSpawnOptions,
): Promise<ChildProcess.ChildProcess> {
  const path = await getNPMPath(pathCWD);

  return ChildProcess.spawn(script, args, {
    cwd,
    stdio: 'inherit',
    shell,
    env: {
      ...process.env,
      [npmPath.PATH]: path,
    },
  });
}

/**
 * Move directory content without conflict.
 *
 * @returns `true` if content completely moved, otherwise `false`.
 */
export function conservativelyMove(from: string, to: string): boolean {
  if (FSExtra.existsSync(to)) {
    if (FSExtra.statSync(to).isDirectory()) {
      const names = FSExtra.readdirSync(from);

      const completelyMoved = names
        .map(name =>
          conservativelyMove(Path.join(from, name), Path.join(to, name)),
        )
        .every(result => result);

      if (completelyMoved) {
        FSExtra.rmdirSync(from);
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  } else if (Path.relative(from, to).startsWith(`..${Path.sep}`)) {
    FSExtra.moveSync(from, to);
    return true;
  } else {
    return false;
  }
}

export function removePathExtension(path: string): string {
  return path.slice(0, -Path.extname(path).length);
}

export async function requireOrImport(path: string): Promise<any> {
  try {
    return __importDefault(require(path));
  } catch {
    return import(pathToFileURL(path).href);
  }
}

function getNPMPath(cwd: string): Promise<string> {
  return new Promise((resolve, reject) =>
    npmPath.get({cwd}, (error, path) => {
      if (error) {
        reject(error);
      } else {
        resolve(path);
      }
    }),
  );
}
