import {createDefaultMagicspaceBuilder} from '@magicspace/core';
import {Command, command, metadata, param} from 'clime';

@command({
  description: 'Update magicspace',
})
export default class extends Command {
  @metadata
  async execute(
    @param({
      default: '.',
    })
    workspacePath: string,
  ): Promise<void> {
    let builder = createDefaultMagicspaceBuilder(workspacePath);

    await builder.build();
  }
}
