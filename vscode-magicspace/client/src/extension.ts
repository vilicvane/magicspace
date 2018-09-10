import {ExtensionContext, commands, window} from 'vscode';

export function activate(context: ExtensionContext): void {
  context.subscriptions.push(
    commands.registerCommand('sayHello', () =>
      window.showInformationMessage('hello'),
    ),
  );
}

export function deactivate(): void {}
