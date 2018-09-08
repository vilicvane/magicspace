import {forEachComment} from 'tsutils';
import {ScriptTarget, SyntaxKind, createSourceFile} from 'typescript';

import {TextEditor, TextEditorEdit} from 'vscode';

import {Commands} from './commands';
import {TextEditorCommand} from './text-editor-command';

export abstract class MultipleCommentCommands extends TextEditorCommand {
  constructor(_commands: Commands | Commands[]) {
    super(_commands);
  }

  execute(textEditor: TextEditor, edit: TextEditorEdit, args: any[]): void {
    this.executeOfComment(textEditor, edit, args);

    let editorDocument = textEditor.document;
    let sourceFile = createSourceFile(
      editorDocument.fileName,
      editorDocument.getText(),
      ScriptTarget.ESNext,
      false,
    );

    forEachComment(sourceFile, (fullText, {kind, pos, end}) => {
      let text = fullText.slice(pos, end);

      if (kind !== SyntaxKind.SingleLineCommentTrivia) {
        this.forEachMultipleComment(text);
      }
    });
  }

  abstract executeOfComment(
    textEditor: TextEditor,
    edit: TextEditorEdit,
    ...args: any[]
  ): void;

  abstract forEachMultipleComment(comment: string): void;
}
