import * as FS from 'fs';
import * as Path from 'path';

export function removeQuotes(value: string): string {
  let groups = /^(['"])(.*)\1$/.exec(value);
  return groups ? groups[2] : '';
}

export function isSubPathOf(
  path: string,
  parentPath: string,
  allowExact = false,
): boolean {
  let relativePath = Path.relative(parentPath, path);

  if (relativePath === '') {
    return allowExact;
  }

  return !relativePath.startsWith(`..${Path.sep}`);
}

export function getFirstSegmentOfPath(path: string): string {
  let [segment] = /^[^\\/]+/.exec(path) || [''];
  return segment;
}

export function getBaseNameWithoutExtension(fileName: string): string {
  return Path.basename(fileName, Path.extname(fileName));
}

export function searchUpperDir(from: string, searchName: string): string {
  let nextDir = from;

  while (true) {
    let currentDir = nextDir;

    let searchPath = Path.join(currentDir, searchName);

    if (FS.existsSync(searchPath)) {
      return currentDir;
    }

    nextDir = Path.dirname(currentDir);

    if (nextDir === currentDir) {
      throw new Error(
        `Cannot find base url directory by search name "${searchName}"`,
      );
    }
  }
}

export function getInBaseUrlOfModulePath(
  path: string,
  baseUrl: string,
  sourceFileName: string,
  tsConfigSearchName: string,
): {ok: boolean; parsedModulePath: string} {
  let modulePath = path;

  if (/^\.{1,2}[\\/]/.test(path)) {
    return {ok: false, parsedModulePath: ''};
  }

  let rootPath = searchUpperDir(sourceFileName, tsConfigSearchName);
  let baseUrlOfAbsolute = Path.posix.join(rootPath, baseUrl);
  modulePath = Path.posix.join(rootPath, baseUrl, modulePath);

  if (!Path.isAbsolute(modulePath)) {
    modulePath = Path.resolve(modulePath);
  }

  return {
    ok: !/^\.{2}\/?/.test(Path.posix.relative(baseUrlOfAbsolute, modulePath)),
    parsedModulePath: modulePath,
  };
}
