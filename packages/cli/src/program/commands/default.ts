import {
  Command,
  HelpInfo,
  Options,
  SubcommandDefinition,
  command,
  metadata,
  option,
} from 'clime';

export const subcommands: SubcommandDefinition[] = [
  {name: 'create'},
  {name: 'init'},
  {name: 'update'},
  {name: 'update-dirs'},
];

export class DefaultCommandOptions extends Options {
  @option({
    toggle: true,
    flag: 'v',
  })
  version!: boolean;
}

@command({
  description: 'Create magicspace config file',
})
export default class DefaultCommand extends Command {
  @metadata
  async execute(options: DefaultCommandOptions): Promise<string | HelpInfo> {
    if (options.version) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
      return require('../../../package').version;
    }

    return DefaultCommand.getHelp();
  }
}
