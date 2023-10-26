import * as Path from 'path';

import Chalk from 'chalk';
import {Command, ExpectedError, command, metadata, param} from 'clime';

import {CommonOptions} from '../@command.js';
import {createDefaultSpace} from '../@space.js';
import {compact} from '../@utils.js';

@command({
  description: 'Update magicspace',
})
export default class extends Command {
  @metadata
  async execute(
    @param({
      default: '.',
    })
    projectDir: string,
    options: CommonOptions,
  ): Promise<string> {
    const space = await createDefaultSpace(
      Path.resolve(projectDir),
      Path.resolve(projectDir, options.magicspace),
    );

    if (space === 'magicspace-dir-not-exists') {
      throw new ExpectedError('Magicspace configuration not found');
    }

    const result = await space.update();

    switch (result) {
      case true: {
        const renames = space.listPendingPossibleDirectoryRenames();

        return compact([
          `\
Update applied, please review and commit changes to complete the update merge.

Please avoid resetting the on-going merge if you want to continue and complete this update.
Otherwise, you can use ${Chalk.yellow(
            'git merge --abort',
          )} to cancel this update and start over again.`,
          renames.length &&
            `\
Possible renamed directories detected:

${renames.map(({from, to}) => `  - ${from} -> ${to}`).join('\n')}

Execute ${Chalk.yellow(
              'magicspace update-dirs',
            )} to update those directories interactively.`,
        ]).join('\n\n');
      }
      case 'not-repository-root':
        throw new ExpectedError(
          `Project directory ${JSON.stringify(
            projectDir,
          )} is not repository root`,
        );
      case 'merge-in-progress':
        throw new ExpectedError(
          'A merge is already in progress, please resolve it before continue',
        );
      case 'empty-repository':
        throw new ExpectedError(
          'You need to make an initial commit and initialize the repository with magicspace',
        );
      case 'not-initialized':
        throw new ExpectedError(
          `This repository has not been initialized with magicspace yet, run ${Chalk.yellow(
            'magicspace init',
          )} first`,
        );
      case 'already-up-to-date':
        return 'Already up-to-date.';
    }
  }
}
