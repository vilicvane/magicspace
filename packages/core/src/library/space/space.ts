import * as Path from 'path';

import Tmp from 'tmp';

import {TEMP_MAGIC_REPOSITORY_DIR_PREFIX} from '../@constants';
import {conservativelyMove, npmRun} from '../@utils';
import type {BoilerplateScriptsLifecycleName} from '../boilerplate';
import type {MagicspaceConfig} from '../config';
import type {File, FileContext} from '../file';

import type {Rename} from './@git';
import {ProjectGit, TempGit} from './@git';
import {Context} from './context';
import type {SpaceLogger} from './space-logger';

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
    ours = false,
  }: ProjectInitializeOptions): Promise<
    'not-repository-root' | 'merge-in-progress' | 'already-initialized' | true
  > {
    const {name: tempDir, removeCallback: tempDirRemoveCallback} = Tmp.dirSync({
      prefix: TEMP_MAGIC_REPOSITORY_DIR_PREFIX,
      unsafeCleanup: true,
    });

    try {
      const projectDir = this.dir;

      const projectGit = new ProjectGit(projectDir);
      const tempGit = new TempGit(tempDir);

      if (!projectGit.isRepositoryRoot()) {
        return 'not-repository-root';
      }

      if (projectGit.isMerging()) {
        return 'merge-in-progress';
      }

      const lastMagicspaceCommit = projectGit.isEmpty()
        ? undefined
        : projectGit.getLastMagicspaceCommit();

      if (lastMagicspaceCommit) {
        return 'already-initialized';
      }

      tempGit.cloneProjectRepositoryWithoutCheckout(projectDir);

      tempGit.checkoutOrphanMagicspaceBranch();

      await this.generate(tempDir);

      await this.runLifecycleScripts('postgenerate', tempDir);

      tempGit.addAndCommitChanges('initialize');

      projectGit.addOrUpdateMagicspaceRemote(tempDir);

      projectGit.pullMagicspaceChangesWithoutCommit('initialize', ours);

      projectGit.removeMagicspaceRemote();

      return true;
    } finally {
      tempDirRemoveCallback();
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
    const {name: tempDir, removeCallback: tempDirRemoveCallback} = Tmp.dirSync({
      prefix: TEMP_MAGIC_REPOSITORY_DIR_PREFIX,
      unsafeCleanup: true,
    });

    try {
      const projectDir = this.dir;

      const projectGit = new ProjectGit(projectDir);
      const tempGit = new TempGit(tempDir);

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

      tempGit.cloneProjectRepositoryWithoutCheckout(projectDir);

      tempGit.checkoutOrphanMagicspaceBranch(lastMagicspaceCommit);

      await this.generate(tempDir);

      await this.runLifecycleScripts('postgenerate', tempDir);

      if (tempGit.isWorkingDirectoryClean()) {
        return 'already-up-to-date';
      }

      tempGit.addAndCommitChanges('update');

      projectGit.addOrUpdateMagicspaceRemote(tempDir);

      projectGit.pullMagicspaceChangesWithoutCommit('update');

      projectGit.removeMagicspaceRemote();

      return true;
    } finally {
      tempDirRemoveCallback();
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
    lifecycle: BoilerplateScriptsLifecycleName,
    cwd: string,
  ): Promise<void> {
    const scriptEntries = this.config.scripts[lifecycle];

    for (const {source: configPath, script} of scriptEntries) {
      const logger = this.logger;

      logger?.info({
        type: 'run-lifecycle-script',
        lifecycle,
        script,
      });

      const subprocess = await npmRun(script, {
        pathCWD: Path.dirname(configPath),
        cwd,
      });

      subprocess.stdout!.on('data', chunk => logger?.stdout(chunk));
      subprocess.stderr!.on('data', chunk => logger?.stderr(chunk));

      await new Promise<void>((resolve, reject) => {
        subprocess.on('exit', code => {
          if (code === 0) {
            resolve();
          } else {
            reject(
              new Error(
                `Script ${JSON.stringify(script)} exited with code ${code}`,
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
    type = this.extensionToFileTypeMap.get(Path.dirname(path)),
  ): File {
    if (!type) {
      throw new Error(
        `Cannot infer composable file type from path ${JSON.stringify(path)}`,
      );
    }

    const creator = this.fileObjectCreatorMap.get(type);

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
}

export interface ProjectInitializeOptions {
  ours?: boolean;
}

export type FileObjectCreator = (path: string, context: FileContext) => File;

/**
 * Possible directory rename from and to, relative path.
 */
export interface PossibleDirectorRename extends Rename {
  from: string;
  to: string;
}
