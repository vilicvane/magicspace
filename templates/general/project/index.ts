import * as Path from 'path';

import {bundle} from '@magicspace/core';

import {keys as prioritizedPackageKeys} from '../package';

export default bundle({
  templates(
    {workspace, project},
    {packageName = project.name, author, license},
  ) {
    return [
      {
        source: {
          type: 'inline',
          content: [Path.posix.relative(workspace.path, project.path)],
        },
        destination: {
          type: 'json',
          filePath: '<workspace>/package.json',
          propertyPath: ['workspaces'],
          mergeStrategy: 'union',
        },
      },
      {
        source: {
          type: 'module',
          filePath: 'package.json.ts',
          options: {
            packageName,
            author,
            license,
          },
        },
        destination: {
          type: 'json',
          filePath: '<project>/package.json',
          spread: true,
          sort: prioritizedPackageKeys,
        },
      },
    ];
  },
});
