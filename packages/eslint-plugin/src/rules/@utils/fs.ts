import * as FS from 'fs';

export function gentleStat(path: string): FS.Stats | undefined {
  try {
    return FS.statSync(path);
  } catch (error) {
    return undefined;
  }
}
