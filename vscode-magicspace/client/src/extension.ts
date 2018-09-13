import * as Path from 'path';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind,
} from 'vscode-languageclient';

import {ExtensionContext, window, workspace} from 'vscode';

let client: LanguageClient;

export function activate(context: ExtensionContext): void {
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

  client = new LanguageClient(
    'magicspaceLanguageServer',
    'magicspace language server',
    serverOptions,
    clientOptions,
  );

  context.subscriptions.push(client.start());

  window.showInformationMessage('language server is started !!');
  // context.subscriptions.push(new InsertCommand());
}

export function deactivate(): Thenable<void> | undefined {
  return client ? client.stop() : undefined;
}
