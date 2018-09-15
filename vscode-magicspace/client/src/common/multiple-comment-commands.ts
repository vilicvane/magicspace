import {forEachComment} from 'tsutils';
import {ScriptTarget, SyntaxKind, createSourceFile} from 'typescript';

import {TextEditor, TextEditorEdit, window} from 'vscode';

import {parse} from '../utils';

import {Commands} from './commands';
import {MagicSpaceComment} from './magicspace-comment';
import {SelectPosition} from './select-position';
import {TextEditorCommand} from './text-editor-command';

export abstract class MultipleCommentCommands extends TextEditorCommand {
  protected selectPosition: SelectPosition = {
    line: -1,
    character: -1,
  };

  constructor(_commands: Commands | Commands[]) {
    super(_commands);
  }

  execute(textEditor: TextEditor, edit: TextEditorEdit, args: any[]): void {
    let selectPosition = textEditor.selection.start;

    this.selectPosition = {
      line: selectPosition.line,
      character: selectPosition.character,
    };
    let editorDocument = textEditor.document;
    let sourceFile = createSourceFile(
      editorDocument.fileName,
      editorDocument.getText(),
      ScriptTarget.ESNext,
      false,
    );

    let tag = false;
    forEachComment(sourceFile, (fullText, {kind, pos, end}) => {
      let text = fullText.slice(pos, end);

      if (kind !== SyntaxKind.SingleLineCommentTrivia && /^\/\*\$/.test(text)) {
        tag = true;

        try {
          let parsedComment = parse(text);
          this.executeOfComment(
            editorDocument.getText().slice(0, pos),
            parsedComment,
            textEditor,
            edit,
            args,
          );
        } catch (e) {
          window.showErrorMessage(
            'Magicspace comment check error, please check your comment',
          );
        }
      }
    });

    if (!tag) {
      window.showWarningMessage(
        'Unable to find Magicspace comment that like /*$ ... */',
      );
    }
  }

  abstract executeOfComment(
    sourceFileContent: string,
    comment: MagicSpaceComment,
    textEditor: TextEditor,
    edit: TextEditorEdit,
    ...args: any[]
  ): void;
}
