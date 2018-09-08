import {Disposable, TextEditor, TextEditorEdit, commands} from 'vscode';

import {XTypeof} from '../utils/typeof';

import {Commands} from './commands';

export abstract class TextEditorCommand implements Disposable {
  private _disposable: Disposable;

  constructor(_commands: Commands | Commands[]) {
    if (XTypeof<string>(_commands, 'String')) {
      _commands = [_commands];
    }

    let subscription: Disposable[] = [];

    for (let command of _commands) {
      subscription.push(
        commands.registerTextEditorCommand(
          command,
          (textEditor: TextEditor, edit: TextEditorEdit, ...args: any[]) =>
            this.execute(textEditor, edit, args),
        ),
      );
    }

    this._disposable = Disposable.from(...subscription);
  }

  dispose(): void {
    return this._disposable && this._disposable.dispose();
  }

  abstract execute(
    textEditor: TextEditor,
    edit: TextEditorEdit,
    args: any[],
  ): void;
}
