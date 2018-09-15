import {ExtensionContext} from 'vscode';

import {InsertCommand} from './commands';
import {createLanguageClient} from './language-client';

export function activate(context: ExtensionContext): void {
  context.subscriptions.push(createLanguageClient(context).start());
  context.subscriptions.push(new InsertCommand());
}
