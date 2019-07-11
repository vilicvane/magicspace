import {project} from '@magicspace/core';
import {AUTHORING} from './@constants';

export default project({
  name: 'magicspace',
  extends: [
    {
      name: '@magicspace/templates/general/workspace',
      options: {
        ...AUTHORING,
        repository: 'https://github.com/makeflow/magicspace.git',
      },
    },
  ],
});
