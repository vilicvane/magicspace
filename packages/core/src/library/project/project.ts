import * as Path from 'path';

import {TEMP_MAGIC_REPOSITORY_DIR} from '../@constants';
import {ProjectGit, Rename, TempGit} from '../@git';
import {conservativelyMove} from '../@utils';
import {Config} from '../config';
import {File} from '../file';

import {ComposableModule} from './composable-module';
import {Context} from './context';

export class Project {
  constructor(
    private fileObjectCreatorMap: Map<string | undefined, FileObjectCreator>,
    private extensionToFileTypeMap: Map<string, string>,
    readonly dir: string,
    readonly config: Config.Config,
  ) {}

  async initialize(): Promise<
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

    if (!projectGit.isWorkingDirectoryClean()) {
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

    projectGit.pullMagicspaceChangesWithoutCommit('initialize');

    projectGit.removeMagicspaceRemote();

    return true;
  }

  async update(): Promise<
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

    if (!projectGit.isWorkingDirectoryClean()) {
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

  async generate(outputDir: string): Promise<void> {
    let {composables: fileEntries, options} = this.config;

    let context = new Context(this, outputDir);

    for (let {path: composableModulePath, base: baseDir} of fileEntries) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      let module: ComposableModule = require(composableModulePath);

      let composables =
        typeof module === 'function' ? module(options, context) : module;

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

        file.compose(composable);
      }
    }

    await context.generate();
  }

  createFileObject(
    path: string,
    possiblePathInProject: string,
    type = this.extensionToFileTypeMap.get(Path.dirname(path)),
  ): File.File<unknown, unknown> {
    let creator = this.fileObjectCreatorMap.get(type);

    if (!creator) {
      throw new Error(`Unknown file type ${JSON.stringify(type)}`);
    }

    return creator(path, possiblePathInProject);
  }
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
