import {ExtendObjectPropertiesOptions, extendObjectProperties} from './object';

export function extendPackageScript(
  script: string | undefined,
  commands: string | string[],
  options?: ExtendObjectPropertiesOptions,
): string {
  if (typeof commands === 'string') {
    commands = [commands];
  }

  if (!script) {
    return commands.join(' && ');
  }

  let existingCommands = script.split('&&').map(command => command.trim());

  let existingCommandDict = Object.fromEntries(
    existingCommands.map(command => [command, true]),
  );
  let extendingCommandDict = Object.fromEntries(
    commands.map(command => [command, true]),
  );

  return Object.entries(
    extendObjectProperties(existingCommandDict, extendingCommandDict, options),
  )
    .map(([command]) => command)
    .join(' && ');
}
