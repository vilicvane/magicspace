import * as Path from 'path';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient';

import {ExtensionContext, workspace} from 'vscode';

export function createLanguageClient(
  context: ExtensionContext,
): LanguageClient {
  let serverModule = context.asAbsolutePath(
    Path.join('server', 'bld', 'server.js'),
  );

  let debugOptions = {execArgv: ['--nolazy', '--inspect=6009']};

  let serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.ipc,
    },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: debugOptions,
    },
  };

  let clientOptions: LanguageClientOptions = {
    documentSelector: [
      {
        scheme: 'file',
        language: 'typescript',
      },
    ],
    synchronize: {
      fileEvents: workspace.createFileSystemWatcher('**/.clientrc'),
    },
  };

  return new LanguageClient(
    'magicspaceLanguageServer',
    'magicspace language server',
    serverOptions,
    clientOptions,
  );
}
