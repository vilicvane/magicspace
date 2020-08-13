import * as Path from 'path';

import {Project} from '@magicspace/core';
import {Command, ExpectedError, command, metadata, param} from 'clime';
import prompts from 'prompts';

@command({
  description: 'Update possible renamed directories',
})
export default class extends Command {
  @metadata
  async execute(
    @param({
      default: '.',
    })
    projectDir: string,
  ): Promise<string> {
    let project = Project.createDefaultProject(Path.resolve(projectDir));

    if (!project.isRepositoryRoot()) {
      throw new ExpectedError(
        `Project directory ${JSON.stringify(
          projectDir,
        )} is not repository root`,
      );
    }

    if (!project.isMerging()) {
      throw new ExpectedError('This project is not actively merging');
    }

    let renames = project.listPendingPossibleDirectoryRenames();

    if (!renames.length) {
      return 'No pending possible directory renames detected.';
    }

    let {renames: selectedRenames} = (await prompts([
      {
        type: 'multiselect',
        name: 'renames',
        message: 'hello',
        instructions: false,
        choices: renames.map(rename => {
          return {
            title: `${rename.from} -> ${rename.to}`,
            value: rename,
          };
        }),
      },
    ])) as {renames: Project.PossibleDirectorRename[]};

    if (selectedRenames.length) {
      project.renameDirectories(selectedRenames);

      return 'Renaming completed.';
    } else {
      return 'Nothing selected.';
    }
  }
}
