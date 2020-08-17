import * as Path from 'path';

import {Command, ExpectedError, command, metadata, option, param} from 'clime';

import {CommonOptions} from '../@command';
import {createDefaultSpace} from '../@space';

export class InitOptions extends CommonOptions {
  @option({
    toggle: true,
    description: 'Use "ours" merge strategy',
    default: false,
  })
  ours!: boolean;
}

@command({
  description: 'Initialize magicspace',
})
export default class extends Command {
  @metadata
  async execute(
    @param({
      default: '.',
    })
    projectDir: string,
    options: InitOptions,
  ): Promise<string> {
    let space = await createDefaultSpace(
      Path.resolve(projectDir),
      Path.resolve(projectDir, options.template),
    );

    if (space === 'template-dir-not-exists') {
      throw new ExpectedError('Magicspace configuration not found');
    }

    let result = await space.initialize(options);

    switch (result) {
      case true:
        return `\
Magicspace initialization started, please review and commit changes to complete the initialize merge.

Please avoid resetting the on-going merge if you want to continue and complete this initialization.
Otherwise, you can use "git merge --abort" to cancel this initialization and start over again.`;
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
          'You need to make an initial commit before initialize the repository with magicspace',
        );
      case 'already-initialized':
        throw new ExpectedError(
          'This repository has already been initialized with magicspace, run `magicspace update` instead',
        );
    }
  }
}
