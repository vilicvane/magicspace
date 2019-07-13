import {project} from '@magicspace/core';
import {AUTHORING} from './@constants';

export default project({
  name: '@magicspace/tslint-rules',
  path: 'packages/tslint-rules',
  extends: [
    {
      name: '@magicspace/templates/typescript',
      options: {
        ...AUTHORING,
        projectType: 'none',
        projectTargets: [
          {
            name: 'rules',
          },
          {
            name: 'test',
            development: true,
          },
        ],
      },
    },
  ],
  templates: [
    {
      source: {
        type: 'inline',
        content: {
          'files.insertFinalNewline': false,
        },
      },
      destination: {
        type: 'json',
        filePath: '<workspace>/.vscode/settings.json',
        propertyPath: ['[plaintext]'],
      },
    },
  ],
});
