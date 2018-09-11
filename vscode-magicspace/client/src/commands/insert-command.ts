import _ from 'lodash';

import {Position, Range, TextEditor, window} from 'vscode';

import {Commands, MagicSpaceComment} from '../common';
import {MultipleCommentCommands} from '../common/multiple-comment-commands';
import {SelectPosition} from '../common/select-position';
import {
  ConvertedString,
  convertString,
  evaluatedStringTemplate,
} from '../utils';

export class InsertCommand extends MultipleCommentCommands {
  private static readonly ERROR_MESSAGE_NAME_UNDEFINED =
    'Name can not be empty in the input box';
  private static readonly ERROR_MESSAGE_NAME_EMPTY =
    'Name can not be empty string in the input box';

  private convertResult: ConvertedString | undefined;

  constructor() {
    super(Commands.InsertCommand);
  }

  private nameChecker(name: string | undefined): name is string {
    if (!name) {
      window.showErrorMessage(InsertCommand.ERROR_MESSAGE_NAME_EMPTY);
      return false;
    } else if (name.trim() === '') {
      window.showErrorMessage(InsertCommand.ERROR_MESSAGE_NAME_UNDEFINED);
      return false;
    }

    return true;
  }

  /** 插入模版 */
  private async insertTemplate(
    comment: MagicSpaceComment,
    textEditor: TextEditor,
  ): Promise<void> {
    let name = await window.showInputBox({
      placeHolder: 'Please input value that name of template',
    });

    if (!this.nameChecker(name)) {
      return;
    }

    let convertResult = convertString(name);
    this.convertResult = convertResult;

    let commentWallName = evaluatedStringTemplate(
      comment.commentBlock,
      convertResult,
    );
    let bothSideSymbolLength = 2;
    let commentWall = _.repeat(
      '/',
      2 * bothSideSymbolLength + 2 + commentWallName.length,
    );
    let bothSideCommentWall = _.repeat('/', bothSideSymbolLength);

    let targetTemplate = [
      '',
      commentWall,
      `${bothSideCommentWall} ${commentWallName} ${bothSideCommentWall}`,
      commentWall,
      '',
      evaluatedStringTemplate(comment.template, convertResult),
    ].join('\n');

    await textEditor.edit(builder =>
      builder.insert(
        new Position(this.selectPosition.line, this.selectPosition.character),
        targetTemplate,
      ),
    );
  }

  private indexOf(
    sourceFileContent: string,
    regex: RegExp,
  ): {position: SelectPosition; ok: boolean} {
    let contentParts = sourceFileContent.split('\n');
    let line: number = -1;
    contentParts.find((code, index) => {
      line = index;
      return regex.test(code);
    });

    let ok = line < 0 ? false : true;

    return {
      position: {
        line,
        character: 0,
      },
      ok,
    };
  }

  private addType(
    sourceFileContent: string,
    comment: MagicSpaceComment,
    textEditor: TextEditor,
    position: SelectPosition,
  ) {
    let targetLine = sourceFileContent.split('\n')[position.line];
    let [defineType, ...assignType] = targetLine.split('=');

    // TODO
    let assignTypeString = assignType.join('').replace(/never/, '');
    window.showInformationMessage(targetLine.length.toString());
    textEditor.edit(builder =>
      builder.replace(
        new Range(
          new Position(position.line, 0),
          new Position(position.line, targetLine.length),
        ),
        [
          defineType,
          [
            evaluatedStringTemplate(
              comment.insert.content,
              this.convertResult!,
            ),
            assignTypeString,
          ].join(''),
        ].join('='),
      ),
    );

    console.info(assignType);
  }

  async executeOfComment(
    sourceFileContent: string,
    comment: MagicSpaceComment,
    textEditor: TextEditor,
  ): Promise<void> {
    await this.insertTemplate(comment, textEditor);

    let {position, ok} = this.indexOf(
      sourceFileContent,
      new RegExp(comment.insert.match),
    );

    // 是否匹配成功
    if (!ok) {
      window.showInformationMessage('Match fail');
      return;
    }

    this.addType(sourceFileContent, comment, textEditor, position);
  }
}
