import * as TSNode from 'ts-node';

import {createDefaultMagicspaceBuilder} from './@default-magicspace-builder';

TSNode.register({
  transpileOnly: true,
  compilerOptions: {
    target: 'es2018',
    esModuleInterop: true,
  },
});

let builder = createDefaultMagicspaceBuilder('.');
// let builder = createDefaultMagicspaceBuilder('demo-2');

builder.build().catch(console.error);
