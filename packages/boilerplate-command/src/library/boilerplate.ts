import {inspect} from 'node:util';

import {boilerplate, x} from '@magicspace/core';

export const CommandOptions = x.object({
  command: x.string,
  args: x.array(x.string).optional(),
});

export const Options = x.object({
  commands: x.array(x.union([CommandOptions, x.string])),
});

export type Options = x.TypeOf<typeof Options>;

export default boilerplate<Options>(async ({commands}) => {
  return {
    scripts: {
      async postcompose({spawn}) {
        for (const generalCommand of commands) {
          const {command, args} =
            typeof generalCommand === 'string'
              ? {command: generalCommand, args: undefined}
              : generalCommand;

          if (args) {
            console.info(
              `> ${generalCommand}${args.length > 0 ? ` ${inspect(args)}` : ''}`,
            );

            await spawn(command, args);
          } else {
            console.info(`> ${command}`);

            await spawn(command, {shell: true});
          }
        }
      },
    },
  };
});
