import * as Path from 'path';

export const TEST_FILES_DIR = '../../../test';

export function getTestsDirPath(...paths: string[]): string {
  return Path.resolve(__dirname, TEST_FILES_DIR, ...paths);
}
