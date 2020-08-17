import * as Path from 'path';

import {__importDefault} from 'tslib';

import {TEMP_MAGIC_REPOSITORY_DIR} from '../@constants';
import {conservativelyMove, npmRun} from '../@utils';
import {Config, BoilerplateScriptsLifecycleName} from '../config';
import {File, FileContext} from '../file';

import {ProjectGit, Rename, TempGit} from './@git';
import {ComposableModuleDefault} from './composable-module';
import {Context} from './context';
import {SpaceLogger} from './space-logger';

export class Space {
  get config(): Config {
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
    private _config?: Config,
    private logger?: SpaceLogger,
  ) {}

  async initialize({
    ours = false,
  }: ProjectInitializeOptions): Promise<
    | 'not-repository-root'
    | 'merge-in-progress'
    | 'empty-repository'
    | 'already-initialized'
    | true
  > {
    let projectDir = this.dir;
    let tempDir = TEMP_MAGIC_REPOSITORY_DIR;

    let projectGit = new ProjectGit(projectDir);
    let tempGit = new TempGit(tempDir);

    if (!projectGit.isRepositoryRoot()) {
      return 'not-repository-root';
    }

    if (projectGit.isMerging()) {
      return 'merge-in-progress';
    }

    if (projectGit.isEmpty()) {
      return 'empty-repository';
    }

    let lastMagicspaceCommit = projectGit.getLastMagicspaceCommit();

    if (lastMagicspaceCommit) {
      return 'already-initialized';
    }

    tempGit.cloneProjectRepositoryWithoutCheckout(projectDir);

    tempGit.checkoutOrphanMagicspaceBranch();

    await this.generate(tempDir);

    await this.runLifecycleScripts('postgenerate');

    tempGit.addAndCommitChanges('initialize');

    projectGit.addOrUpdateMagicspaceRemote(tempDir);

    projectGit.pullMagicspaceChangesWithoutCommit('initialize', ours);

    projectGit.removeMagicspaceRemote();

    return true;
  }

  async update(): Promise<
    | 'not-repository-root'
    | 'merge-in-progress'
    | 'empty-repository'
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

    if (projectGit.isMerging()) {
      return 'merge-in-progress';
    }

    if (projectGit.isEmpty()) {
      return 'empty-repository';
    }

    let lastMagicspaceCommit = projectGit.getLastMagicspaceCommit();

    if (!lastMagicspaceCommit) {
      return 'not-initialized';
    }

    tempGit.cloneProjectRepositoryWithoutCheckout(projectDir);

    tempGit.checkoutOrphanMagicspaceBranch(lastMagicspaceCommit);

    await this.generate(tempDir);

    await this.runLifecycleScripts('postgenerate');

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
    options?: Magicspace.BoilerplateOptions,
  ): Promise<void> {
    let {composables: fileEntries, options: configOptions} = this.config;

    options = {
      ...configOptions,
      ...options,
    };

    let context = new Context(this, outputDir);

    for (let {path: composableModulePath, base: baseDir} of fileEntries) {
      let moduleDefault = __importDefault(
        // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
        require(composableModulePath),
      ).default as ComposableModuleDefault;

      let composables =
        typeof moduleDefault === 'function'
          ? await moduleDefault(options, context)
          : moduleDefault;

      if (!composables) {
        continue;
      }

      this.logger?.info({
        type: 'loaded-composable-module',
        path: composableModulePath,
      });

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

        await file.compose(composable, {composableModulePath});
      }
    }

    await context.generate();
  }

  async runLifecycleScripts(
    lifecycle: BoilerplateScriptsLifecycleName,
  ): Promise<void> {
    let scriptEntries = this.config.scripts[lifecycle];

    for (let {configFilePath, script} of scriptEntries) {
      let subprocess = await npmRun(script, {
        pathCWD: Path.dirname(configFilePath),
        cwd: TEMP_MAGIC_REPOSITORY_DIR,
      });

      await new Promise((resolve, reject) => {
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
  ): File<unknown, unknown> {
    if (!type) {
      throw new Error(
        `Cannot infer composable file type from path ${JSON.stringify(path)}`,
      );
    }

    let creator = this.fileObjectCreatorMap.get(type);

    if (!creator) {
      throw new Error(`Unknown file type ${JSON.stringify(type)}`);
    }

    return creator(path, context);
  }

  assertFileObject(
    file: File<unknown, unknown>,
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
  ours?: boolean;
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
  context: FileContext,
) => File<unknown, unknown>;

/**
 * Possible directory rename from and to, relative path.
 */
export interface PossibleDirectorRename extends Rename {
  from: string;
  to: string;
}
