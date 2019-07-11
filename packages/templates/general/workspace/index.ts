import {bundle} from '@magicspace/core';

import {keys as prioritizedPackageKeys} from '../package';

export default bundle({
  workspace: true,
  templates(
    {},
    {repository, author, license, copyrightYear = getCurrentFullYear()},
  ) {
    return [
      {
        source: {
          type: 'text',
          filePath: '.gitignore',
        },
        destination: {
          type: 'text',
          filePath: '<workspace>/.gitignore',
          mergeStrategy: 'append',
        },
      },
      ...(license
        ? ([
            {
              source: {
                type: 'handlebars',
                filePath: `licenses/${license}.hbs`,
                options: {
                  copyrightYear,
                  copyrightHolder: author,
                },
              },
              destination: {
                type: 'text',
                filePath: '<workspace>/LICENSE',
              },
            },
          ] as const)
        : []),
      {
        source: {
          type: 'json',
          filePath: '.vscode/settings.json',
        },
        destination: {
          type: 'json',
          filePath: '<workspace>/.vscode/settings.json',
          mergeStrategy: 'deep',
        },
      },
      {
        source: {
          type: 'module',
          filePath: 'package.json.ts',
          options: {
            repository,
            author,
            license,
          },
        },
        destination: {
          type: 'json',
          filePath: '<workspace>/package.json',
          mergeStrategy: 'shallow',
          spread: true,
          sort: prioritizedPackageKeys,
        },
      },
      {
        source: {
          type: 'json',
          filePath: 'package.json.json',
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
      {
        source: {
          type: 'json',
          filePath: '.prettierrc',
        },
        destination: {
          type: 'json',
          filePath: '<workspace>/.prettierrc',
          spread: true,
          mergeStrategy: 'deep',
        },
      },
      {
        source: {
          type: 'text',
          filePath: '.prettierignore',
        },
        destination: {
          type: 'text',
          filePath: '<workspace>/.prettierignore',
        },
      },
    ];
  },
});

function getCurrentFullYear(): string {
  return new Date().getFullYear().toString();
}
