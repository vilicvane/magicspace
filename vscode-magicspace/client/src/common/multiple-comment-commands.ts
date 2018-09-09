import {forEachComment} from 'tsutils';
import {ScriptTarget, SyntaxKind, createSourceFile} from 'typescript';

import {TextEditor, TextEditorEdit} from 'vscode';

import {parseComment} from '../utils';

import {Commands} from './commands';
import {MagicSpaceComment} from './magicspace-comment';
import {TextEditorCommand} from './text-editor-command';

export abstract class MultipleCommentCommands extends TextEditorCommand {
  constructor(_commands: Commands | Commands[]) {
    super(_commands);
  }

  execute(textEditor: TextEditor, edit: TextEditorEdit, args: any[]): void {
    let editorDocument = textEditor.document;
    let sourceFile = createSourceFile(
      editorDocument.fileName,
      editorDocument.getText(),
      ScriptTarget.ESNext,
      false,
    );

    forEachComment(sourceFile, (fullText, {kind, pos, end}) => {
      let text = fullText.slice(pos, end);

      if (kind !== SyntaxKind.SingleLineCommentTrivia && /^\/\*\$/.test(text)) {
        this.executeOfComment(parseComment(text), textEditor, edit, args);
      }
    });
  }

  abstract executeOfComment(
    comment: MagicSpaceComment,
    textEditor: TextEditor,
    edit: TextEditorEdit,
    ...args: any[]
  ): void;
}
