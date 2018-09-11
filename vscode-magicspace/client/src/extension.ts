import {ExtensionContext} from 'vscode';

import {InsertCommand} from './commands';

export function activate(context: ExtensionContext): void {
  context.subscriptions.push(new InsertCommand());
}

export function deactivate(): void {}
