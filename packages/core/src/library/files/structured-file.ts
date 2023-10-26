import type {GeneralSortObjectKeysOptions} from '@magicspace/utils';
import {sortObjectKeys} from '@magicspace/utils';
import _ from 'lodash';

import {File} from '../file/index.js';

export type StructuredFileOptions = {
  sortKeys?: GeneralSortObjectKeysOptions;
};

export abstract class StructuredFile<
  TContent,
  TOptions extends StructuredFileOptions,
> extends File<TContent, TOptions> {
  protected abstract stringify(content: TContent): string;

  override toText(): string {
    const {sortKeys: sortKeysOptions} = this.options;

    let content = this.content;

    if (sortKeysOptions && _.isPlainObject(content)) {
      content = sortObjectKeys(content as any, sortKeysOptions);
    }

    return this.stringify(content);
  }
}
