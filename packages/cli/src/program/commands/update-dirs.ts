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
    let space = await createDefaultSpace(Path.resolve(projectDir), undefined);

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
    ])) as {renames: PossibleDirectorRename[]};

    if (selectedRenames.length) {
      space.renameDirectories(selectedRenames);

      return 'Renaming completed.';
    } else {
      return 'Nothing selected.';
    }
  }
}
