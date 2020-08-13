import * as Path from 'path';

import {Project} from '@magicspace/core';
import {Command, ExpectedError, command, metadata, option, param} from 'clime';

import {CommonOptions} from '../@command';

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
    let project = Project.createDefaultProject(
      Path.resolve(projectDir),
      Path.resolve(projectDir, options.template),
    );

    let result = await project.initialize(options);

    switch (result) {
      case true:
        return `\
Magicspace initialized, please review and commit changes to complete the initialize merge.

Please avoid resetting the on-going merge if you want to continue and complete this update.
Otherwise, you can use "git merge --abort" to cancel this update and start over again.`;
      case 'not-repository-root':
        throw new ExpectedError(
          `Project directory ${JSON.stringify(
            projectDir,
          )} is not repository root`,
        );
      case 'working-directory-not-clean':
        throw new ExpectedError('Working directory not clean');
      case 'already-initialized':
        throw new ExpectedError('The project has already been initialized');
    }
  }
}
