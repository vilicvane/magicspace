import {bundle} from '@magicspace/core';

import {keys as prioritizedPackageKeys} from '../package';

export default bundle({
  templates({project}, {packageName = project.name, author, license}) {
    return [
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
          mergeStrategy: 'deep',
          sort: prioritizedPackageKeys,
        },
      },
    ];
  },
});
