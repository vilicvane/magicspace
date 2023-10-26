import Micromatch from 'micromatch';

import {addElementsToSequentialArray} from './array.js';

export type ExtendPackageScriptOptions = {
  /**
   * Add after command that matches this pattern presents (it will skips continuous
   * match).
   *
   * @link https://github.com/micromatch/micromatch
   */
  after?: string;
  /**
   * Add before command that matches this pattern presents.
   *
   * @link https://github.com/micromatch/micromatch
   */
  before?: string;
};

export function extendPackageScript(
  script: string | undefined,
  commands: string | string[],
  {after: afterPattern, before: beforePattern}: ExtendPackageScriptOptions = {},
): string {
  if (typeof commands === 'string') {
    commands = [commands];
  }

  if (!script) {
    return commands.join(' && ');
  }

  const existingCommands = script.split('&&').map(command => command.trim());

  return addElementsToSequentialArray(existingCommands, commands, {
    isAfterAnchor: afterPattern
      ? command => Micromatch.isMatch(command, afterPattern)
      : undefined,
    isBeforeAnchor: beforePattern
      ? command => Micromatch.isMatch(command, beforePattern)
      : undefined,
  }).join(' && ');
}
