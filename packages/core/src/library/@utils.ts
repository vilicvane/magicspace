import * as ChildProcess from 'child_process';
import * as Path from 'path';

import * as FSExtra from 'fs-extra';
import npmPath from 'npm-path';

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
  let {error, status, stdout, stderr} = ChildProcess.spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: {
      // Make sure Git write console in English
      // https://www.gnu.org/software/gettext/manual/html_node/Locale-Environment-Variables.html
      // https://www.gnu.org/software/gettext/manual/html_node/The-LANGUAGE-variable.html#The-LANGUAGE-variable
      LC_ALL: 'C',
    },
  });

  if (error) {
    throw error;
  }

  if (status !== 0) {
    throw new SpawnSyncFailure(command, args, cwd, stdout, stderr, status);
  }

  return stdout;
}

export interface NPMRunOptions {
  pathCWD: string;
  cwd: string;
}

export async function npmRun(
  script: string,
  {pathCWD, cwd}: NPMRunOptions,
): Promise<ChildProcess.ChildProcess> {
  let path = await new Promise<string>((resolve, reject) =>
    npmPath.get({cwd: pathCWD}, (error: any, path: string) => {
      if (error) {
        reject(error);
      } else {
        resolve(path);
      }
    }),
  );

  return ChildProcess.exec(script, {
    cwd,
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
      let names = FSExtra.readdirSync(from);

      let completelyMoved = names
        .map(name =>
          conservativelyMove(Path.join(from, name), Path.join(to, name)),
        )
        .every(result => result);

      if (completelyMoved) {
        FSExtra.rmdirSync(from);
      }

      return true;
    } else {
      return false;
    }
  } else {
    FSExtra.moveSync(from, to);
    return true;
  }
}

export function removePathExtension(path: string): string {
  return path.slice(0, -Path.extname(path).length);
}
