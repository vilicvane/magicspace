import * as Path from 'path';

import * as FSExtra from 'fs-extra';
import _ from 'lodash';

import {
  DIRECTORY_DETECTION_FIND_RENAMES_THRESHOLD,
  MAGICSPACE_BRANCH,
  MAGICSPACE_INITIALIZE_COMMIT_MESSAGE,
  MAGICSPACE_INITIALIZE_MERGE_MESSAGE,
  MAGICSPACE_REMOTE,
  MAGICSPACE_UPDATE_COMMIT_MESSAGE,
  MAGICSPACE_UPDATE_MERGE_MESSAGE,
  MAGIC_COMMIT_MESSAGE_REGEX_STRING,
  PULL_FIND_RENAMES_THRESHOLD,
} from '../@constants';
import {SpawnSyncFailure, spawnSync} from '../@utils';

import type {SpaceLogger} from './space-logger';

export class Git {
  constructor(
    readonly dir: string,
    protected logger?: SpaceLogger,
  ) {}

  isWorkingDirectoryClean(): boolean {
    return !spawnSync(this.dir, 'git', ['status', '--porcelain']).trim();
  }
}

export class ProjectGit extends Git {
  isRepositoryRoot(): boolean {
    try {
      return (
        spawnSync(this.dir, 'git', ['rev-parse', '--git-dir']).trim() === '.git'
      );
    } catch {
      return false;
    }
  }

  isEmpty(): boolean {
    try {
      spawnSync(this.dir, 'git', ['log', '-1']);
      return false;
    } catch {
      return true;
    }
  }

  isMerging(): boolean {
    const mergeHeadFilePath = Path.join(this.dir, '.git/MERGE_HEAD');

    return FSExtra.existsSync(mergeHeadFilePath);
  }

  getLastMagicspaceCommit(): string | undefined {
    return spawnSync(this.dir, 'git', [
      'rev-list',
      '--grep',
      MAGIC_COMMIT_MESSAGE_REGEX_STRING,
      '--extended-regexp',
      'HEAD',
    ]).match(/.+/)?.[0];
  }

  addOrUpdateMagicspaceRemote(tempDir: string): void {
    try {
      spawnSync(this.dir, 'git', ['remote', 'remove', MAGICSPACE_REMOTE]);
    } catch (error) {
      if (!(error instanceof SpawnSyncFailure)) {
        throw error;
      }

      if (!/(?:error|fatal): No such remote:/.test(error.stderr)) {
        this.logger?.stderr(error.stderr);

        throw new Error('Error removing magicspace remote');
      }
    }

    spawnSync(this.dir, 'git', [
      'remote',
      'add',
      MAGICSPACE_REMOTE,
      Path.join(tempDir, '.git'),
    ]);
  }

  removeMagicspaceRemote(): void {
    spawnSync(this.dir, 'git', ['remote', 'remove', MAGICSPACE_REMOTE]);
  }

  pullMagicspaceChangesWithoutCommit(
    type: 'initialize' | 'update',
    ours = false,
  ): void {
    try {
      const stdout = spawnSync(this.dir, 'git', [
        'pull',
        '--no-commit',
        '--no-rebase',
        '--allow-unrelated-histories',
        ...(ours ? ['--strategy=ours'] : []),
        '--strategy-option=patience',
        `--strategy-option=find-renames=${PULL_FIND_RENAMES_THRESHOLD}`,
        MAGICSPACE_REMOTE,
        MAGICSPACE_BRANCH,
      ]);

      this.logger?.stdout(stdout);
    } catch (error) {
      if (!(error instanceof SpawnSyncFailure)) {
        throw error;
      }

      if (!/^CONFLICT/m.test(error.stdout)) {
        this.logger?.stderr(error.stderr);

        if (/^error: Your local changes/m.test(error.stderr)) {
          throw new Error(
            'Cannot merge magicspace changes, conflict with local changes',
          );
        }

        if (
          /^error: The following untracked working tree files would be overwritten by merge:/m.test(
            error.stderr,
          )
        ) {
          throw new Error(
            'Cannot merge magicspace changes, conflict with untracked files',
          );
        }

        throw new Error('Error merging magicspace changes');
      }

      this.logger?.stdout(error.stdout);
    }

    FSExtra.outputFileSync(
      Path.join(this.dir, '.git/MERGE_MSG'),
      type === 'initialize'
        ? MAGICSPACE_INITIALIZE_MERGE_MESSAGE
        : MAGICSPACE_UPDATE_MERGE_MESSAGE,
    );
  }

  listPossibleDirectoryRenames(): Rename[] {
    const mergeHeadFilePath = Path.join(this.dir, '.git/MERGE_HEAD');

    if (!FSExtra.existsSync(mergeHeadFilePath)) {
      throw new Error('Expecting .git/MERGE_HEAD to be present');
    }

    const mergeHead = FSExtra.readFileSync(mergeHeadFilePath, 'utf8').trim();

    const diff = spawnSync(this.dir, 'git', [
      'show',
      '--diff-filter=R',
      `--find-renames=${DIRECTORY_DETECTION_FIND_RENAMES_THRESHOLD}`,
      '--format=',
      mergeHead,
    ]);

    let renames: Rename[] = [];

    const diffRenameRegex = /^rename from (.+)\r?\n^rename to (.+)/gm;
    let diffRenameGroups: RegExpExecArray | null;

    // eslint-disable-next-line no-cond-assign
    while ((diffRenameGroups = diffRenameRegex.exec(diff))) {
      renames.push({
        from: diffRenameGroups[1],
        to: diffRenameGroups[2],
      });
    }

    // foo/* -> bar/*
    //    foo -> bar

    // foo/yo/* -> foo/ha/*
    //    foo/yo -> foo/ha

    // foo/yo/bar/* -> foo/ha/bar/*
    //    foo/yo -> foo/ha

    // foo/yo/bar/* -> foo/ha/ha/bar/*
    //    foo/yo -> foo/ha/ha

    // foo/* -> foo/ha/ha/foo/*
    //    foo/yo -> foo/ha/ha

    // * -> foo/*
    //    n/a

    // bar/* -> foo/bar/*
    //    bar -> foo/bar

    // bar/ha/* -> foo/bar/ha/*
    //    bar -> foo/bar

    // foo/bar/* -> bar/*
    //    foo/bar -> bar

    // foo/* -> *
    //    foo -> .

    renames = renames
      .map(({from, to}) => {
        let fromDir = Path.dirname(from);
        let toDir = Path.dirname(to);

        if (fromDir === toDir) {
          return undefined;
        }

        if (fromDir === '.') {
          return undefined;
        }

        if (toDir === '.') {
          return {
            from: fromDir,
            to: toDir,
          };
        }

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const nextFromDir = Path.dirname(fromDir);
          const nextToDir = Path.dirname(toDir);

          if (
            Path.basename(fromDir) !== Path.basename(toDir) ||
            nextFromDir === '.' ||
            nextToDir === '.'
          ) {
            return {
              from: fromDir,
              to: toDir,
            };
          }

          fromDir = Path.dirname(fromDir);
          toDir = Path.dirname(toDir);
        }
      })
      .filter((rename): rename is Rename => !!rename);

    return _.uniqBy(renames, ({from, to}) => JSON.stringify({from, to})).filter(
      rename => FSExtra.existsSync(rename.from),
    );
  }
}

export class TempGit extends Git {
  cloneProjectRepositoryWithoutCheckout(projectDir: string): void {
    FSExtra.removeSync(this.dir);

    spawnSync(projectDir, 'git', [
      'clone',
      '--shared',
      '--no-checkout',
      '.git',
      this.dir,
    ]);
  }

  checkoutOrphanMagicspaceBranch(commit?: string): void {
    spawnSync(this.dir, 'git', [
      'symbolic-ref',
      'HEAD',
      `refs/heads/${MAGICSPACE_BRANCH}`,
    ]);

    if (commit) {
      spawnSync(this.dir, 'git', ['reset', commit]);
    }
  }

  addAndCommitChanges(type: 'initialize' | 'update'): void {
    spawnSync(this.dir, 'git', ['add', '.']);

    spawnSync(this.dir, 'git', [
      'commit',
      '--message',
      type === 'initialize'
        ? MAGICSPACE_INITIALIZE_COMMIT_MESSAGE
        : MAGICSPACE_UPDATE_COMMIT_MESSAGE,
    ]);
  }
}

/**
 * Rename from and to, relative path.
 */
export interface Rename {
  from: string;
  to: string;
}
