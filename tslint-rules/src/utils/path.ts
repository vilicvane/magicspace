import * as Path from 'path';

const KNOWN_MODULE_EXTENSION_REGEX = /\.(?:jsx?|tsx?)$/i;

export function removeQuotes(value: string): string {
  let groups = /^(['"])(.*)\1$/.exec(value);
  return groups ? groups[2] : '';
}

export function removeModuleFileExtension(fileName: string): string {
  return fileName.replace(/\.(?:(?:js|ts)x?|d\.ts)?$/i, '');
}

export function hasKnownModuleExtension(fileName: string): boolean {
  return KNOWN_MODULE_EXTENSION_REGEX.test(fileName);
}

export function getBaseNameWithoutExtension(fileName: string): string {
  return Path.basename(fileName, Path.extname(fileName));
}
