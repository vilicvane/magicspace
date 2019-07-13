import * as Path from 'path';

import {bundle} from '@magicspace/core';
import _ from 'lodash';

import {keys as prioritizedPackageKeys} from '../package';

export default bundle({
  templates(
    {workspace, project},
    {packageName = project.name, author, license},
  ) {
    let relativePath = Path.posix.relative(workspace.path, project.path);

    return _.compact([
      {
        source: {
          type: 'handlebars',
          filePath: 'README.md.hbs',
          placeholder: true,
          options: {
            heading: project.name,
          },
        },
        destination: {
          type: 'text',
          filePath: '<project>/README.md',
          mergeStrategy: 'ignore',
        },
      },
      relativePath
        ? {
            source: {
              type: 'inline',
              content: [relativePath],
            },
            destination: {
              type: 'json',
              filePath: '<workspace>/package.json',
              propertyPath: ['workspaces'],
              mergeStrategy: 'union',
            },
          }
        : undefined,
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
          mergeStrategy: 'shallow',
          spread: true,
          sort: prioritizedPackageKeys,
        },
      },
    ]);
  },
});
