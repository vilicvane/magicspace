import {ExtensionContext} from 'vscode';

import {InsertCommand} from './commands';
import {MagicspaceStatusBar} from './common/status-bar';
import {createLanguageClient} from './language-client';

export function activate(context: ExtensionContext): void {
  context.subscriptions.push(createLanguageClient(context).start());
  context.subscriptions.push(new InsertCommand());
  context.subscriptions.push(new MagicspaceStatusBar());
}
