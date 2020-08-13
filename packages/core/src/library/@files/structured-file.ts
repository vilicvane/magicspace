import sortKeys from 'sort-keys';

import {File} from '../file';

export interface StructuredFileOptions {
  /**
   * Sort content keys. A string array can be specified as a shortcut of `top`.
   */
  sortKeys?: StructuredFileSortKeysOptions | string[];
}

export abstract class StructuredFile<
  TContent,
  TOptions extends StructuredFileOptions
> extends File.File<TContent, TOptions> {
  protected abstract stringify(content: TContent): string;

  toText(): string {
    let {sortKeys: sortKeysOptions}: TOptions = Object.assign(
      {},
      ...this.composables.map(composable => composable.options),
    );

    let content = this.content;

    if (sortKeysOptions) {
      if (Array.isArray(sortKeysOptions)) {
        sortKeysOptions = {top: sortKeysOptions};
      }

      let {top, bottom, compare, deep} = sortKeysOptions;

      let topKeyToIndexMap = new Map(top?.map((key, index) => [key, index]));
      let bottomKeyToIndexMap = new Map(
        bottom?.map((key, index) => [key, index]),
      );

      content = sortKeys(content, {
        compare(left, right) {
          if (topKeyToIndexMap.has(left)) {
            if (topKeyToIndexMap.has(right)) {
              return topKeyToIndexMap.get(left)! - topKeyToIndexMap.get(right)!;
            }

            return -1;
          } else if (topKeyToIndexMap.has(right)) {
            return 1;
          }

          if (bottomKeyToIndexMap.has(left)) {
            if (bottomKeyToIndexMap.has(right)) {
              return (
                bottomKeyToIndexMap.get(left)! - bottomKeyToIndexMap.get(right)!
              );
            }

            return 1;
          } else if (bottomKeyToIndexMap.has(right)) {
            return -1;
          }

          return compare ? compare(left, right) : 0;
        },
        deep,
      });
    }

    return this.stringify(content);
  }
}

export interface StructuredFileSortKeysOptions {
  top?: string[];
  bottom?: string[];
  compare?(left: string, right: string): number;
  deep?: boolean;
}
