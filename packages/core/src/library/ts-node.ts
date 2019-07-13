import * as TSNode from 'ts-node';

export function registerTSNode(): void {
  TSNode.register({
    transpileOnly: true,
    compilerOptions: {
      target: 'es2018',
      esModuleInterop: true,
    },
  });
}
