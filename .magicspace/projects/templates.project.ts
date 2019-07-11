import {project} from '@magicspace/core';
import {AUTHORING} from './@constants';

export default project({
  name: '@magicspace/templates',
  path: 'packages/templates',
  extends: [
    {
      name: '@magicspace/templates/general',
      options: {
        ...AUTHORING,
      },
    },
  ],
});
