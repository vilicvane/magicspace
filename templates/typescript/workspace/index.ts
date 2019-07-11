import {keys as prioritizedPackageKeys} from '../../general/package';
import {bundle} from '@magicspace/core';

export default bundle({
  workspace: true,
  extends: ['../../general/workspace'],
  templates: [
    {
      source: {
        type: 'handlebars',
        filePath: '.gitignore',
      },
      destination: {
        type: 'text',
        filePath: '<workspace>/.gitignore',
        mergeStrategy: 'append',
      },
    },
    {
      source: {
        type: 'module',
        filePath: 'package.json',
        propertyPath: ['devDependencies'],
      },
      destination: {
        type: 'json',
        filePath: '<workspace>/package.json',
        propertyPath: ['devDependencies'],
        mergeStrategy: 'shallow',
        spread: true,
      },
    },
  ],
});
