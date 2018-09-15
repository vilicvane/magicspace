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
  constructor() {
    super(Commands.InsertCommand);
  }

  async executeOfComment(
    sourceFileContent: string,
    comment: MagicSpaceComment,
    textEditor: TextEditor,
  ): Promise<void> {
    let {position, ok} = this.indexOf(
      sourceFileContent,
      new RegExp(comment.insert.match),
    );

    // 是否匹配成功
    if (!ok) {
      window.showInformationMessage('Match fail');
      return;
    }

    let convertResult = await this.parseTextOfInputBox();

    if (!convertResult) {
      return;
    }

    await this.addType(
      sourceFileContent,
      comment,
      textEditor,
      position,
      convertResult,
    );

    await this.insertTemplate(comment, textEditor, convertResult);
  }

  async addType(
    sourceFileContent: string,
    comment: MagicSpaceComment,
    textEditor: TextEditor,
    position: SelectPosition,
    convertResult: ConvertedString,
  ): Promise<void> {
    let targetLine = sourceFileContent.split('\n')[position.line];
    let [defineType, ...assignType] = targetLine.split('=');

    // TODO
    let assignTypeString = assignType.join('').replace(/never/, '');
    let hasSemicolon: boolean =
      assignTypeString.charAt(assignTypeString.length - 1) === ';';
    assignTypeString = hasSemicolon
      ? assignTypeString.slice(0, assignTypeString.length - 1)
      : assignTypeString;

    await textEditor.edit(builder =>
      builder.replace(
        new Range(
          new Position(position.line, 0),
          new Position(position.line, targetLine.length),
        ),
        [
          defineType,
          [
            assignTypeString,
            evaluatedStringTemplate(comment.insert.content, convertResult),
            hasSemicolon ? ';' : '',
          ].join(''),
        ].join('='),
      ),
    );
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

  private async parseTextOfInputBox(): Promise<ConvertedString | undefined> {
    let name = await window.showInputBox({
      placeHolder: 'Please input value that name of template',
    });

    if (!this.nameChecker(name)) {
      return undefined;
    }

    let convertResult = convertString(name);

    return convertResult;
  }

  /** 插入模版 */
  private async insertTemplate(
    comment: MagicSpaceComment,
    textEditor: TextEditor,
    convertResult: ConvertedString,
  ): Promise<void> {
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
  ): {
    position: SelectPosition;
    ok: boolean;
  } {
    let contentParts = sourceFileContent.split('\n');
    let line = contentParts.findIndex(code => regex.test(code));

    let ok = line < 0 ? false : true;

    return {
      position: {
        line,
        character: 0,
      },
      ok,
    };
  }

  private static readonly ERROR_MESSAGE_NAME_UNDEFINED =
    'Name can not be empty in the input box';
  private static readonly ERROR_MESSAGE_NAME_EMPTY =
    'Name can not be empty string in the input box';
}
