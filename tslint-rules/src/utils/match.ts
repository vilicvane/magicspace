import * as Path from 'path';

import * as resolve from 'resolve';

export function matchNodeCore(path: string): boolean {
  try {
    return require.resolve(path) === path;
  } catch (error) {
    return false;
  }
}

export function matchNodeModules(
  modulePath: string,
  sourceFilePath: string,
): boolean {
  let basedir = Path.dirname(sourceFilePath);

  let resolvedPath: string;

  try {
    resolvedPath = resolve.sync(modulePath, {basedir});
  } catch (error) {
    return false;
  }

  let relativePath = Path.relative(basedir, resolvedPath);

  return /[\\/]node_modules[\\/]/.test(relativePath);
}
