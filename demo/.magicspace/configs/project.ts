import {project} from '@magicspace/core';
import {AUTHORING} from '../@constants';

export default project({
  name: '@magicspace/configs',
  path: 'packages/configs',
  extends: [
    {
      name: '@magicspace/templates/general',
      options: {
        ...AUTHORING,
      },
    },
  ],
});
