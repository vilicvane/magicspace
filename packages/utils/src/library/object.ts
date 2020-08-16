import * as Micromatch from 'micromatch';
import sortObjectKeys from 'sort-keys';
import {Dict} from 'tslang';

const hasOwnProperty = Object.prototype.hasOwnProperty;

export interface ExtendObjectPropertiesOptions {
  /**
   * Set after key that matches this pattern presents (it will skips
   * continuous match).
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
  {after, before}: ExtendObjectPropertiesOptions = {},
): object {
  let extensionEntries = Object.entries(extension);

  let addingEntries: [string, unknown][] = [];
  let settingEntries: [string, unknown][] = [];

  for (let entry of extensionEntries) {
    if (hasOwnProperty.call(object, entry[0])) {
      settingEntries.push(entry);
    } else {
      addingEntries.push(entry);
    }
  }

  object = {
    ...object,
    ...Object.fromEntries(settingEntries),
  };

  if (addingEntries.length === 0) {
    return object;
  }

  let entries = Object.entries(object);

  let afterHitIndex = -1;
  let beforeHitIndex = -1;

  for (let [index, [existingKey]] of entries.entries()) {
    // If `after` option is present, and if there's no after hit yet
    // (afterHitIndex < 0) or if the last after hit is just the former entry
    // (index - afterHitIndex === 1).
    if (after && (afterHitIndex < 0 || index - afterHitIndex === 1)) {
      let afterHit = Micromatch.isMatch(existingKey, after);

      if (afterHit) {
        afterHitIndex = index;
      } else if (afterHitIndex >= 0) {
        // If we already had a hit, and this one is not hit, then we can safely
        // end searching.
        break;
      }
    }

    if (before && beforeHitIndex < 0) {
      let beforeHit = Micromatch.isMatch(existingKey, before);

      if (beforeHit) {
        beforeHitIndex = index;
        break;
      }
    }
  }

  if (afterHitIndex >= 0) {
    // Handle extension already has some entries after the anchor.

    let matchingEntries: [string, unknown][] = [];

    let remainingEntries = entries.splice(afterHitIndex + 1);

    for (let [key] of extensionEntries) {
      if (remainingEntries[0]?.[0] === key) {
        matchingEntries.push(remainingEntries.shift()!);
      } else if (addingEntries[0]?.[0] === key) {
        matchingEntries.push(addingEntries.shift()!);
      } else {
        break;
      }
    }

    entries.splice(
      afterHitIndex + 1,
      0,
      ...matchingEntries,
      ...addingEntries,
      ...remainingEntries,
    );
  } else if (beforeHitIndex >= 0) {
    entries.splice(beforeHitIndex, 0, ...addingEntries);
  } else {
    entries.push(...addingEntries);
  }

  return Object.fromEntries(entries);
}

export {sortObjectKeys};
