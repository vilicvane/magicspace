import * as FSExtra from 'fs-extra';
import {BuiltInParserName} from 'prettier';

import {getPrettierModule} from '../@prettier';

import {Composable} from './composable';

export abstract class File<TContent, TComposeOptions> {
  abstract content: TContent;

  composables: Composable<TContent, TComposeOptions>[] = [];

  constructor(
    readonly type: string,
    readonly path: string,
    readonly possiblePathInProject: string,
  ) {}

  async compose(
    composable: Composable<TContent, TComposeOptions>,
  ): Promise<void> {
    this.composables.push(composable);
    this.content = await composable.compose(this.content, this);
  }

  toText?(): string;

  toBuffer?(): Buffer;

  async save(): Promise<void> {
    let content: string | Buffer;

    if (this.toText) {
      content = this.toText();

      let possiblePathInProject = this.possiblePathInProject;

      let Prettier = getPrettierModule(possiblePathInProject);

      let prettierConfigOptions =
        (await Prettier.resolveConfig(possiblePathInProject)) ??
        (await Prettier.resolveConfig(this.path, {
          useCache: false,
        }));

      if (prettierConfigOptions) {
        let {inferredParser} = await Prettier.getFileInfo(
          possiblePathInProject,
          {resolveConfig: true},
        );

        if (inferredParser) {
          content = Prettier.format(content, {
            parser: inferredParser as BuiltInParserName,
            ...prettierConfigOptions,
          });
        }
      }
    } else if (this.toBuffer) {
      content = this.toBuffer();
    } else {
      throw new Error(
        'Invalid composable file, either `toText()` or `toBuffer()` must be implemented',
      );
    }

    FSExtra.outputFileSync(this.path, content);
  }
}
