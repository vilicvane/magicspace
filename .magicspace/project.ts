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
  templates: [
    {
      source: {
        type: 'inline',
        content: undefined,
      },
      destination: {
        type: 'json',
        filePath: '<workspace>/package.json',
        propertyPath: ['devDependencies', '@magicspace/configs'],
      },
    },
  ],
});
