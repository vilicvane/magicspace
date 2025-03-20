import * as Path from 'path';

import Chalk from 'chalk';
import {Command, ExpectedError, command, metadata, option, param} from 'clime';

import {CommonOptions} from '../@command.js';
import {createDefaultSpace} from '../@space.js';

export class InitOptions extends CommonOptions {
  @option({
    toggle: true,
    description:
      'Force initialization even if the repository is already initialized',
    default: false,
  })
  force!: boolean;

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
    const space = await createDefaultSpace(
      Path.resolve(projectDir),
      Path.resolve(projectDir, options.magicspace),
    );

    if (space === 'magicspace-dir-not-exists') {
      throw new ExpectedError('Magicspace configuration not found');
    }

    const result = await space.initialize(options);

    switch (result) {
      case true:
        return `\
Magicspace initialization started, please review and commit changes to complete the initialize merge.

Please avoid resetting the on-going merge if you want to continue and complete this initialization.
Otherwise, you can use ${Chalk.yellow(
          'git merge --abort',
        )} to cancel this initialization and start over again.`;
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
      case 'already-initialized':
        throw new ExpectedError(
          `This repository has already been initialized with magicspace, run ${Chalk.yellow(
            'magicspace update',
          )} instead`,
        );
    }
  }
}
