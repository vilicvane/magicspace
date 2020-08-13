import * as Path from 'path';

import {Project} from '@magicspace/core';
import {Command, Context, ExpectedError, command, metadata, param} from 'clime';

import {CommonOptions} from '../@command';
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
    context: Context,
  ): Promise<string> {
    let project = Project.createDefaultProject(
      Path.resolve(projectDir),
      Path.resolve(projectDir, options.template),
    );

    let result = await project.update(options);

    switch (result) {
      case true:
        let renames = project.listPendingPossibleDirectoryRenames();

        return compact([
          `\
Update applied, please review and commit changes to complete the update merge.
Please avoid resetting the on-going merge unless you want to start over again.`,
          renames.length &&
            `\
Possible renamed directories detected:

${renames.map(({from, to}) => `  - ${from} -> ${to}`).join('\n')}

Execute "${
              context.commands[0]
            } update-dirs" to update those directories interactively.`,
        ]).join('\n\n');
      case 'not-repository-root':
        throw new ExpectedError(
          `Project directory ${JSON.stringify(
            projectDir,
          )} is not repository root`,
        );
      case 'working-directory-not-clean':
        throw new ExpectedError('Working directory not clean');
      case 'not-initialized':
        throw new ExpectedError(
          'The project has not been initialized with magicspace yet',
        );
      case 'already-up-to-date':
        return 'Already up-to-date.';
    }
  }
}
