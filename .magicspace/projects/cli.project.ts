import {project} from '@magicspace/core';
import {AUTHORING} from './@constants';

export default project({
  name: 'magicspace',
  path: 'packages/cli',
  extends: [
    {
      name: '@magicspace/templates/clime',
      options: {
        ...AUTHORING,
        commandName: 'magicspace',
      },
    },
  ],
});
