import _ from 'lodash';
import * as Micromatch from 'micromatch';
import sortObjectKeys from 'sort-keys';
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

export {sortObjectKeys};
