import * as Path from 'path';

import {createDefaultMagicspaceBuilder} from '@magicspace/core';
import {Command, command, metadata, param} from 'clime';

@command({
  description: 'Initialize magicspace',
})
export default class extends Command {
  @metadata
  async execute(
    @param({
      default: '.',
    })
    workspacePath: string,
  ): Promise<void> {
    let builder = createDefaultMagicspaceBuilder(workspacePath, {
      magicspacePath: Path.join(__dirname, '../../../magicspace'),
    });

    await builder.build();
  }
}
