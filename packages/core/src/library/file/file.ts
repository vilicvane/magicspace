import * as FSExtra from 'fs-extra';

import {Composable} from './composable';
import {Context} from './context';

export abstract class File<TContent, TComposeOptions> {
  readonly context = new Context(this.path);

  constructor(readonly path: string) {}

  abstract compose(composable: Composable<TContent, TComposeOptions>): void;

  abstract toBuffer(): Buffer;

  save(): void {
    let buffer = this.toBuffer();

    FSExtra.outputFileSync(this.path, buffer);
  }
}
