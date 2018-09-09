import {TextEditor, TextEditorEdit} from 'vscode';

import {Commands, MagicSpaceComment} from '../common';
import {MultipleCommentCommands} from '../common/multiple-comment-commands';

export class InsertCommand extends MultipleCommentCommands {
  constructor() {
    super(Commands.InsertCommand);
  }

  executeOfComment(
    comment: MagicSpaceComment,
    textEditor: TextEditor,
    edit: TextEditorEdit,
  ): void {}
}
