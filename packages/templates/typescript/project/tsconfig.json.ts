import {source} from '@magicspace/core';

interface Options {
  compilerOptions: object;
}

export default source<Options>(({compilerOptions}) => {
  return {
    compilerOptions: {
      target: 'es2018',
      module: 'commonjs',
      lib: ['esnext'],
      types: [],
      importHelpers: true,
      esModuleInterop: true,
      experimentalDecorators: true,
      sourceMap: true,
      stripInternal: true,

      strict: true,
      strictFunctionTypes: false,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true,

      newLine: 'LF',

      ...compilerOptions,
    },
  };
});
