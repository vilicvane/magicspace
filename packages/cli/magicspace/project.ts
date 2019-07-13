import * as Path from 'path';

import {project} from '@magicspace/core';

export default project({
  name: 'magicspace',
  path: '.magicspace',
  templates({workspace}) {
    return [
      {
        source: {
          type: 'handlebars',
          filePath: 'tsconfig.json.hbs',
          placeholder: '<workspace>/.magicspace',
        },
        destination: {
          type: 'text',
          filePath: '<workspace>/.magicspace/tsconfig.json',
        },
      },
      {
        source: {
          type: 'handlebars',
          filePath: 'project.ts.hbs',
          placeholder: '<workspace>/.magicspace',
          options: {
            projectName: Path.basename(workspace.path),
          },
        },
        destination: {
          type: 'text',
          filePath: '<workspace>/.magicspace/project.ts',
        },
      },
    ];
  },
});
