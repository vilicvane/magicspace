import * as Path from 'path';

import {TEMP_MAGIC_REPOSITORY_DIR} from '../@constants';
import {ProjectGit, Rename, TempGit} from '../@git';
import {conservativelyMove} from '../@utils';
import {Config} from '../config';
import {File} from '../file';

import {ComposableModule} from './composable-module';
import {Context} from './context';

export class Project {
  get config(): Config.Config {
    let config = this._config;

    if (!config) {
      throw new Error('Config is not available under current context');
    }

    return config;
  }

  constructor(
    private fileObjectCreatorMap: Map<string | undefined, FileObjectCreator>,
    private extensionToFileTypeMap: Map<string, string>,
    readonly dir: string,
    private _config?: Config.Config,
  ) {}

  async initialize({
    force = false,
    ours = false,
  }: ProjectInitializeOptions): Promise<
    | 'not-repository-root'
    | 'already-initialized'
    | 'working-directory-not-clean'
    | true
  > {
    let projectDir = this.dir;
    let tempDir = TEMP_MAGIC_REPOSITORY_DIR;

    let projectGit = new ProjectGit(projectDir);
    let tempGit = new TempGit(tempDir);

    if (!projectGit.isRepositoryRoot()) {
      return 'not-repository-root';
    }

    if (!force && !projectGit.isWorkingDirectoryClean()) {
      return 'working-directory-not-clean';
    }

    let lastMagicspaceCommit = projectGit.getLastMagicspaceCommit();

    if (lastMagicspaceCommit) {
      return 'already-initialized';
    }

    tempGit.cloneProjectRepositoryWithoutCheckout(projectDir);

    tempGit.checkoutOrphanMagicspaceBranch();

    await this.generate(tempDir);

    tempGit.addAndCommitChanges('initialize');

    projectGit.addOrUpdateMagicspaceRemote(tempDir);

    projectGit.pullMagicspaceChangesWithoutCommit('initialize', ours);

    projectGit.removeMagicspaceRemote();

    return true;
  }

  async update({
    force = false,
  }: ProjectUpdateOptions): Promise<
    | 'not-repository-root'
    | 'working-directory-not-clean'
    | 'not-initialized'
    | 'already-up-to-date'
    | true
  > {
    let projectDir = this.dir;
    let tempDir = TEMP_MAGIC_REPOSITORY_DIR;

    let projectGit = new ProjectGit(projectDir);
    let tempGit = new TempGit(tempDir);

    if (!projectGit.isRepositoryRoot()) {
      return 'not-repository-root';
    }

    if (!force && !projectGit.isWorkingDirectoryClean()) {
      return 'working-directory-not-clean';
    }

    let lastMagicspaceCommit = projectGit.getLastMagicspaceCommit();

    if (!lastMagicspaceCommit) {
      return 'not-initialized';
    }

    tempGit.cloneProjectRepositoryWithoutCheckout(projectDir);

    tempGit.checkoutOrphanMagicspaceBranch(lastMagicspaceCommit);

    await this.generate(tempDir);

    if (tempGit.isWorkingDirectoryClean()) {
      return 'already-up-to-date';
    }

    tempGit.addAndCommitChanges('update');

    projectGit.addOrUpdateMagicspaceRemote(tempDir);

    projectGit.pullMagicspaceChangesWithoutCommit('update');

    projectGit.removeMagicspaceRemote();

    return true;
  }

  isRepositoryRoot(): boolean {
    let projectGit = new ProjectGit(this.dir);

    return projectGit.isRepositoryRoot();
  }

  isMerging(): boolean {
    let projectGit = new ProjectGit(this.dir);

    return projectGit.isMerging();
  }

  listPendingPossibleDirectoryRenames(): PossibleDirectorRename[] {
    let projectGit = new ProjectGit(this.dir);

    return projectGit.listPossibleDirectoryRenames();
  }

  renameDirectories(renames: PossibleDirectorRename[]): void {
    for (let {from, to} of renames) {
      conservativelyMove(Path.join(this.dir, from), Path.join(this.dir, to));
    }
  }

  async generate(
    outputDir: string,
    options?: Magicspace.TemplateOptions,
  ): Promise<void> {
    let {composables: fileEntries, options: configOptions} = this.config;

    options = {
      ...configOptions,
      ...options,
    };

    let context = new Context(this, outputDir);

    for (let {path: composableModulePath, base: baseDir} of fileEntries) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      let module: ComposableModule = require(composableModulePath);

      let composables =
        typeof module === 'function' ? await module(options, context) : module;

      if (!Array.isArray(composables)) {
        composables = [composables];
      }

      for (let composable of composables) {
        if (typeof composable.compose !== 'function') {
          throw new Error(`Invalid composable in "${composableModulePath}"`);
        }

        let path = resolveComposingFilePath({
          composingFilePath: composable.path,
          composableModulePath,
          outputDir,
          baseDir,
        });

        let file = context.ensureFile(path, composable);

        await file.compose(composable);
      }
    }

    await context.generate();
  }

  createFileObject(
    path: string,
    possiblePathInProject: string,
    type = this.extensionToFileTypeMap.get(Path.dirname(path)),
  ): File.File<unknown, unknown> {
    if (!type) {
      throw new Error(
        `Cannot infer composable file type from path ${JSON.stringify(path)}`,
      );
    }

    let creator = this.fileObjectCreatorMap.get(type);

    if (!creator) {
      throw new Error(`Unknown file type ${JSON.stringify(type)}`);
    }

    return creator(path, possiblePathInProject);
  }

  assertFileObject(
    file: File.File<unknown, unknown>,
    path: string,
    type: string | undefined,
  ): void {
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
  force?: boolean;
  ours?: boolean;
}

export interface ProjectUpdateOptions {
  force?: boolean;
}

interface ResolveComposingFilePathOptions {
  composingFilePath: string | undefined;
  composableModulePath: string;
  outputDir: string;
  baseDir: string;
}

function resolveComposingFilePath({
  composingFilePath,
  composableModulePath,
  outputDir,
  baseDir,
}: ResolveComposingFilePathOptions): string {
  if (typeof composingFilePath !== 'string') {
    composingFilePath = Path.basename(
      composableModulePath,
      Path.extname(composableModulePath),
    );
  }

  return Path.resolve(outputDir, baseDir, composingFilePath);
}

export type FileObjectCreator = (
  path: string,
  possiblePathInProject: string,
) => File.File<unknown, unknown>;

/**
 * Possible directory rename from and to, relative path.
 */
export interface PossibleDirectorRename extends Rename {
  from: string;
  to: string;
}
