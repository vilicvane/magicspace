import assert from 'assert';

import {bundle} from '@magicspace/core';

export default bundle({
  extends: [
    {
      name: '../typescript',
      options: {
        projectType: 'program',
      },
    },
  ],
  templates({}, {commandName}) {
    assert(typeof commandName === 'string');

    return [
      {
        source: {
          type: 'inline',
          content: {
            emitDecoratorMetadata: true,
          },
        },
        destination: {
          type: 'json',
          filePath: '<project>/src/program/tsconfig.json',
          propertyPath: ['compilerOptions'],
          mergeStrategy: 'shallow',
          spread: true,
        },
      },
      {
        source: {
          type: 'json',
          filePath: 'package.json.json',
          propertyPath: ['dependencies'],
        },
        destination: {
          type: 'json',
          filePath: '<project>/package.json',
          propertyPath: ['dependencies'],
          mergeStrategy: 'shallow',
          spread: true,
        },
      },
      {
        source: {
          type: 'handlebars',
          filePath: 'main.ts.hbs',
          placeholder: '<project>/src/program',
          options: {
            commandName,
          },
        },
        destination: {
          type: 'text',
          filePath: '<project>/src/program/main.ts',
        },
      },
      {
        source: {
          type: 'handlebars',
          filePath: 'commands/default.ts.hbs',
          placeholder: '<project>/src/program',
        },
        destination: {
          type: 'text',
          filePath: '<project>/src/program/commands/default.ts',
        },
      },
      {
        source: {
          type: 'inline',
          content: {
            [commandName!]: 'bld/program/main.js',
          },
        },
        destination: {
          type: 'json',
          filePath: '<project>/package.json',
          propertyPath: ['bin'],
          mergeStrategy: 'shallow',
          spread: true,
        },
      },
    ];
  },
});
