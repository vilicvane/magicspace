import * as FS from 'fs';
import * as Path from 'path';

export const TEST_FILES_DIR = '../../../test';

export function getTestsDirPath(...paths: string[]): string {
  return Path.resolve(__dirname, TEST_FILES_DIR, ...paths);
}

export function getTestFileFullPath(
  rulePath: string,
  testFileRelativePath: string,
): string {
  return Path.join(rulePath, testFileRelativePath);
}

export function getTestFileContent(
  rulePath: string,
  testFileRelativePath: string,
): string {
  return FS.readFileSync(
    getTestFileFullPath(rulePath, testFileRelativePath),
  ).toString();
}
