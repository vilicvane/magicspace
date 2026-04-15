import type {ChildProcess} from 'child_process';
import * as Path from 'path';

import {dirSync as tmpDirSync} from 'tmp';

import {TEMP_MAGIC_REPOSITORY_DIR_PREFIX} from '../@constants.js';
import {conservativelyMove, npmSpawn} from '../@utils.js';
import type {BoilerplatePostcomposeScriptSpawnOptions} from '../boilerplate/index.js';
import type {MagicspaceConfig, MagicspaceConfigScriptName} from '../config.js';
import type {File, FileContext} from '../file/index.js';

import type {Rename} from './@git.js';
import {ProjectGit, TempGit} from './@git.js';
import {Context} from './context.js';
import type {SpaceLogger} from './space-logger.js';

export class Space {
  get config(): MagicspaceConfig {
    const config = this._config;

    if (!config) {
      throw new Error('Config is not available under current context');
    }

    return config;
  }

  constructor(
    private fileObjectCreatorMap: Map<string | undefined, FileObjectCreator>,
    private extensionToFileTypeMap: Map<string, string>,
    readonly dir: string,
    private _config?: MagicspaceConfig,
    private logger?: SpaceLogger,
  ) {}

  async initialize({
    force = false,
    ours = false,
  }: ProjectInitializeOptions): Promise<
    'not-repository-root' | 'merge-in-progress' | 'already-initialized' | true
  > {
    const {
      projectDir,
      projectGit,
      tempProjectDir,
      tempProjectGit,
      tempProjectDirRemoveCallback,
    } = this.prepareDirsAndGits();

    try {
      if (!projectGit.isRepositoryRoot()) {
        return 'not-repository-root';
      }

      if (projectGit.isEmpty()) {
        projectGit.makeInitialCommit();
      }

      if (projectGit.isMerging()) {
        return 'merge-in-progress';
      }

      if (!force && projectGit.getLastMagicspaceCommit()) {
        return 'already-initialized';
      }

      tempProjectGit.cloneProjectRepositoryWithoutCheckout(projectDir);

      tempProjectGit.checkoutOrphanMagicspaceBranch();

      await this.generate(tempProjectDir);

      await this.runLifecycleScripts('postcompose', tempProjectDir);

      tempProjectGit.addAndCommitChanges('initialize');

      projectGit.addOrUpdateMagicspaceRemote(tempProjectDir);

      projectGit.pullMagicspaceChangesWithoutCommit('initialize', ours);

      projectGit.removeMagicspaceRemote();

      return true;
    } finally {
      tempProjectDirRemoveCallback();
    }
  }

  async update(): Promise<
    | 'not-repository-root'
    | 'merge-in-progress'
    | 'empty-repository'
    | 'not-initialized'
    | 'already-up-to-date'
    | true
  > {
    const {
      projectDir,
      projectGit,
      tempProjectDir,
      tempProjectGit,
      tempProjectDirRemoveCallback,
    } = this.prepareDirsAndGits();

    try {
      if (!projectGit.isRepositoryRoot()) {
        return 'not-repository-root';
      }

      if (projectGit.isMerging()) {
        return 'merge-in-progress';
      }

      if (projectGit.isEmpty()) {
        return 'empty-repository';
      }

      const lastMagicspaceCommit = projectGit.getLastMagicspaceCommit();

      if (!lastMagicspaceCommit) {
        return 'not-initialized';
      }

      tempProjectGit.cloneProjectRepositoryWithoutCheckout(projectDir);

      tempProjectGit.checkoutOrphanMagicspaceBranch(lastMagicspaceCommit);

      await this.generate(tempProjectDir);

      await this.runLifecycleScripts('postcompose', tempProjectDir);

      if (tempProjectGit.isWorkingDirectoryClean()) {
        return 'already-up-to-date';
      }

      tempProjectGit.addAndCommitChanges('update');

      projectGit.addOrUpdateMagicspaceRemote(tempProjectDir);

      projectGit.pullMagicspaceChangesWithoutCommit('update');

      projectGit.removeMagicspaceRemote();

      return true;
    } finally {
      tempProjectDirRemoveCallback();
    }
  }

  isRepositoryRoot(): boolean {
    const projectGit = new ProjectGit(this.dir);

    return projectGit.isRepositoryRoot();
  }

  isMerging(): boolean {
    const projectGit = new ProjectGit(this.dir);

    return projectGit.isMerging();
  }

  listPendingPossibleDirectoryRenames(): PossibleDirectorRename[] {
    const projectGit = new ProjectGit(this.dir);

    return projectGit.listPossibleDirectoryRenames();
  }

  renameDirectories(renames: PossibleDirectorRename[]): void {
    for (const {from, to} of renames) {
      conservativelyMove(Path.join(this.dir, from), Path.join(this.dir, to));
    }
  }

  async generate(outputDir: string): Promise<void> {
    const {composables} = this.config;

    const context = new Context(this, outputDir);

    for (const composable of composables) {
      const file = context.ensureFile(
        Path.join(outputDir, composable.target),
        composable,
      );

      await file.compose(composable);
    }

    await context.generate();
  }

  async runLifecycleScripts(
    lifecycle: MagicspaceConfigScriptName,
    cwd: string,
  ): Promise<void> {
    const logger = this.logger;

    const scriptEntries = this.config.scripts[lifecycle];

    for (const {source: configPath, script} of scriptEntries) {
      logger?.info({
        type: 'run-lifecycle-script',
        lifecycle,
        script,
      });

      const pathCWD = Path.dirname(configPath);

      if (typeof script === 'function') {
        await script({
          async spawn(
            command,
            ...restArgs:
              | [string[], BoilerplatePostcomposeScriptSpawnOptions?]
              | [BoilerplatePostcomposeScriptSpawnOptions?]
          ) {
            const [args, options] = Array.isArray(restArgs[0])
              ? (restArgs as [
                  string[],
                  BoilerplatePostcomposeScriptSpawnOptions?,
                ])
              : [undefined, restArgs[0]];

            const subprocess = await npmSpawn(command, {
              pathCWD,
              cwd,
              shell: options?.shell,
              args,
            });

            await handleSubprocess(command, subprocess);
          },
        });
      } else {
        const subprocess = await npmSpawn(script, {
          pathCWD,
          cwd,
          shell: true,
        });

        await handleSubprocess(script, subprocess);
      }
    }

    function handleSubprocess(
      command: string,
      subprocess: ChildProcess,
    ): Promise<void> {
      return new Promise<void>((resolve, reject) => {
        subprocess.on('exit', code => {
          if (code === 0) {
            resolve();
          } else {
            reject(
              new Error(
                `Command ${JSON.stringify(command)} exited with code ${code}`,
              ),
            );
          }
        });
      });
    }
  }

  createFileObject(
    path: string,
    context: FileContext,
    type: string | undefined,
    creator: FileObjectCreator | undefined,
  ): File {
    if (type === undefined && !creator) {
      throw new Error(
        `Cannot infer composable file type from path ${JSON.stringify(path)}`,
      );
    }

    if (!creator) {
      creator = this.fileObjectCreatorMap.get(type);
    }

    if (!creator) {
      throw new Error(`Unknown file type ${JSON.stringify(type)}`);
    }

    return creator(path, context);
  }

  assertFileObject(file: File, path: string, type: string | undefined): void {
    if (type && file.type !== type) {
      throw new Error(
        `File ${JSON.stringify(
          path,
        )} has inconsistent composable file types ${JSON.stringify(
          file.type,
        )} and ${JSON.stringify(type)}`,
      );
    }
  }

  private prepareDirsAndGits(): {
    projectDir: string;
    projectGit: ProjectGit;
    tempProjectDir: string;
    tempProjectGit: TempGit;
    tempProjectDirRemoveCallback: () => void;
  } {
    const {name: tempDir, removeCallback: tempProjectDirRemoveCallback} =
      tmpDirSync({
        prefix: TEMP_MAGIC_REPOSITORY_DIR_PREFIX,
        unsafeCleanup: true,
      });

    const projectDir = this.dir;
    const projectGit = new ProjectGit(projectDir);

    const tempProjectDir = Path.join(tempDir, Path.basename(projectDir));
    const tempProjectGit = new TempGit(tempProjectDir);

    return {
      projectDir,
      projectGit,
      tempProjectDir,
      tempProjectGit,
      tempProjectDirRemoveCallback,
    };
  }
}

export type ProjectInitializeOptions = {
  force?: boolean;
  ours?: boolean;
};

export type FileObjectCreator = (path: string, context: FileContext) => File;

/**
 * Possible directory rename from and to, relative path.
 */
export type PossibleDirectorRename = {
  from: string;
  to: string;
} & Rename;
