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
          type: 'handlebars',
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
          spread: true,
          mergeStrategy: 'deep',
          sort: prioritizedPackageKeys,
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
    ];
  },
});

function getCurrentFullYear(): string {
  return new Date().getFullYear().toString();
}
