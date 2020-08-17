import * as Path from 'path';

import {PossibleDirectorRename} from '@magicspace/core';
import {Command, ExpectedError, command, metadata, param} from 'clime';
import prompts from 'prompts';

import {createDefaultSpace} from '../@space';

@command({
  description: 'Update possible renamed directories interactively',
})
export default class extends Command {
  @metadata
  async execute(
    @param({
      default: '.',
    })
    projectDir: string,
  ): Promise<string> {
    let space = await createDefaultSpace(Path.resolve(projectDir));

    if (!space.isRepositoryRoot()) {
      throw new ExpectedError(
        `Project directory ${JSON.stringify(
          projectDir,
        )} is not repository root`,
      );
    }

    if (!space.isMerging()) {
      throw new ExpectedError('This project is not actively merging');
    }

    let renames = space.listPendingPossibleDirectoryRenames();

    if (!renames.length) {
      return 'No pending possible directory renames detected.';
    }

    let selectedRenames = (
      await prompts([
        {
          type: 'multiselect',
          name: 'renames',
          message: 'Select directory renames to apply',
          instructions: false,
          choices: renames.map(rename => {
            return {
              title: `${rename.from} -> ${rename.to}`,
              value: rename,
            };
          }),
        },
      ])
    ).renames as PossibleDirectorRename[];

    if (selectedRenames.length) {
      space.renameDirectories(selectedRenames);

      return 'Renaming completed.';
    } else {
      return 'Nothing selected.';
    }
  }
}
