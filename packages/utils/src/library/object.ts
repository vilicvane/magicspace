import _ from 'lodash';
import * as Micromatch from 'micromatch';
import {Dict} from 'tslang';

import {addElementsToSequentialArray} from './array';

export interface ExtendObjectPropertiesOptions {
  /**
   * Set after key that matches this pattern presents (it will skips continuous
   * match).
   *
   * @link https://github.com/micromatch/micromatch
   */
  after?: string;
  /**
   * Set before key that matches this pattern presents.
   *
   * @link https://github.com/micromatch/micromatch
   */
  before?: string;
  /**
   * Replace existing, defaults to `true`.
   */
  replace?: boolean;
}

export function extendObjectProperties<
  T extends object,
  TExtension extends object
>(
  object: T | undefined,
  extension: TExtension,
  options?: ExtendObjectPropertiesOptions,
): T & TExtension;
export function extendObjectProperties(
  object: Dict<unknown> = {},
  extension: object,
  {
    after: afterPattern,
    before: beforePattern,
    replace: toReplace = true,
  }: ExtendObjectPropertiesOptions = {},
): object {
  let entries = addElementsToSequentialArray(
    Object.entries(object),
    Object.entries(extension),
    {
      getKey([key]) {
        return key;
      },
      isAfterAnchor: afterPattern
        ? ([key]) => Micromatch.isMatch(key, afterPattern)
        : undefined,
      isBeforeAnchor: beforePattern
        ? ([key]) => Micromatch.isMatch(key, beforePattern)
        : undefined,
      replace: toReplace,
    },
  );

  return _.fromPairs(entries);
}

export type GeneralSortObjectKeysKeyOptions = SortObjectKeysKeyOptions | string;

export interface SortObjectKeysKeyOptions {
  key: string;
  subKeys?: GeneralSortObjectKeysOptions;
}

export type GeneralSortObjectKeysOptions =
  | 'asc'
  | 'desc'
  | SortObjectKeysOptions
  | GeneralSortObjectKeysKeyOptions[];

export interface SortObjectKeysOptions {
  top?: GeneralSortObjectKeysKeyOptions[];
  bottom?: GeneralSortObjectKeysKeyOptions[];
  rest?: SortObjectKeysKeyOptions[];
  compare?(left: string, right: string): number;
  deep?: boolean;
}

export function sortObjectKeys<T extends object>(
  object: T,
  options: GeneralSortObjectKeysOptions,
): T;
export function sortObjectKeys(
  object: object,
  options: GeneralSortObjectKeysOptions,
): object {
  if (options === 'asc') {
    options = {
      compare(left, right) {
        return left < right ? -1 : 1;
      },
    };
  } else if (options === 'desc') {
    options = {
      compare(left, right) {
        return left < right ? 1 : -1;
      },
    };
  } else if (Array.isArray(options)) {
    options = {top: options};
  }

  let {top = [], bottom = [], rest = [], compare, deep} = options;

  let topKeyToIndexMap = new Map(
    top.map((keyOptions, index) => [
      typeof keyOptions === 'string' ? keyOptions : keyOptions.key,
      index,
    ]),
  );
  let bottomKeyToIndexMap = new Map(
    bottom.map((keyOptions, index) => [
      typeof keyOptions === 'string' ? keyOptions : keyOptions.key,
      index,
    ]),
  );
  let keyToOptionsMap = new Map(
    [...top, ...bottom, ...rest].map(keyOptions => {
      if (typeof keyOptions === 'string') {
        keyOptions = {key: keyOptions};
      }

      return [keyOptions.key, keyOptions.subKeys];
    }),
  );

  let entries = Object.entries(object)
    .map(([key, value]) => {
      if (_.isPlainObject(value)) {
        let keyOptions = keyToOptionsMap.get(key);

        if (!keyOptions && deep) {
          keyOptions = options;
        }

        if (keyOptions) {
          value = sortObjectKeys(value, keyOptions);
        }
      }

      return [key, value];
    })
    .sort(([leftKey], [rightKey]) => {
      if (topKeyToIndexMap.has(leftKey)) {
        if (topKeyToIndexMap.has(rightKey)) {
          return (
            topKeyToIndexMap.get(leftKey)! - topKeyToIndexMap.get(rightKey)!
          );
        }

        return -1;
      } else if (topKeyToIndexMap.has(rightKey)) {
        return 1;
      }

      if (bottomKeyToIndexMap.has(leftKey)) {
        if (bottomKeyToIndexMap.has(rightKey)) {
          return (
            bottomKeyToIndexMap.get(leftKey)! -
            bottomKeyToIndexMap.get(rightKey)!
          );
        }

        return 1;
      } else if (bottomKeyToIndexMap.has(rightKey)) {
        return -1;
      }

      return compare ? compare(leftKey, rightKey) : 0;
    });

  return _.fromPairs(entries);
}
