import * as Path from 'path';

import {Command, ExpectedError, command, metadata, param} from 'clime';

import {CommonOptions} from '../@command';
import {createDefaultSpace} from '../@space';
import {compact} from '../@utils';

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
    let space = await createDefaultSpace(
      Path.resolve(projectDir),
      Path.resolve(projectDir, options.boilerplate),
    );

    if (space === 'boilerplate-dir-not-exists') {
      throw new ExpectedError('Magicspace configuration not found');
    }

    let result = await space.update();

    switch (result) {
      case true:
        let renames = space.listPendingPossibleDirectoryRenames();

        return compact([
          `\
Update applied, please review and commit changes to complete the update merge.

Please avoid resetting the on-going merge if you want to continue and complete this update.
Otherwise, you can use \`git merge --abort\` to cancel this update and start over again.`,
          renames.length &&
            `\
Possible renamed directories detected:

${renames.map(({from, to}) => `  - ${from} -> ${to}`).join('\n')}

Execute \`magicspace update-dirs\` to update those directories interactively.`,
        ]).join('\n\n');
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
          'This repository has not been initialized with magicspace yet, run `magicspace init` first',
        );
      case 'already-up-to-date':
        return 'Already up-to-date.';
    }
  }
}
