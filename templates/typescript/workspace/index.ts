import {keys as prioritizedPackageKeys} from '../../general/package';
import {bundle} from '@magicspace/core';

export default bundle({
  workspace: true,
  extends: ['../../general/workspace'],
  templates: [
    {
      source: {
        type: 'module',
        filePath: 'package.json.ts',
      },
      destination: {
        type: 'json',
        filePath: '<workspace>/package.json',
        spread: true,
        mergeStrategy: 'deep',
        sort: prioritizedPackageKeys,
      },
    },
  ],
});
