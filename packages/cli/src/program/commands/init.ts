import * as Path from 'path';

import {Project} from '@magicspace/core';
import {Command, ExpectedError, command, metadata, param} from 'clime';

import {CommonOptions} from '../@command';

@command({
  description: 'Initialize magicspace',
})
export default class extends Command {
  @metadata
  execute(
    @param({
      default: '.',
    })
    projectDir: string,
    options: CommonOptions,
  ): string {
    let project = Project.createDefaultProject(
      Path.resolve(projectDir),
      Path.resolve(projectDir, options.template),
    );

    let result = project.initialize();

    switch (result) {
      case true:
        return `\
Magicspace initialized, please review and commit changes to complete the initialize merge.
Please avoid resetting the on-going merge unless you want to start over again.`;
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
