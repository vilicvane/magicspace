import * as FS from 'fs';
import * as Path from 'path';

import * as FastGlob from 'fast-glob';

import {BinaryFileOptions, JSONFileOptions, TextFileOptions} from './@files';
import {File} from './file';

export function text<TMetadata extends object = object>(
  content: string | File.ComposeFunction<unknown, string, TMetadata>,
  options?: TextFileOptions,
): File.Composable<string, TextFileOptions>;
export function text<TMetadata extends object = object>(
  path: string,
  content: string | File.ComposeFunction<unknown, string, TMetadata>,
  options?: TextFileOptions,
): File.Composable<string, TextFileOptions>;
export function text(...args: any[]): File.Composable<string, TextFileOptions> {
  let path: string | undefined;
  let content: string;
  let options: TextFileOptions;

  if (typeof args[0] === 'string') {
    [path, content, options] = args;
  } else {
    [content, options] = args;
  }

  let composer: File.ComposeFunction<unknown, string, object>;

  if (typeof content === 'function') {
    composer = content as File.ComposeFunction<unknown, string, object>;
  } else {
    composer = () => content;
  }

  return {
    type: 'text',
    path,
    compose: composer,
    options,
  };
}

export function json<TContent, TMetadata extends object = object>(
  value: TContent | File.ComposeFunction<unknown, TContent, TMetadata>,
  options?: JSONFileOptions,
): File.Composable<TContent, JSONFileOptions>;
export function json<TContent, TMetadata extends object = object>(
  path: string,
  value: TContent | File.ComposeFunction<unknown, TContent, TMetadata>,
  options?: JSONFileOptions,
): File.Composable<TContent, JSONFileOptions>;
export function json(
  ...args: any[]
): File.Composable<unknown, JSONFileOptions> {
  let path: string | undefined;
  let value: unknown;
  let options: JSONFileOptions;

  if (typeof args[0] === 'string') {
    [path, value, options] = args;
  } else {
    [value, options] = args;
  }

  let composer: File.ComposeFunction<unknown, unknown, object>;

  if (typeof value === 'function') {
    composer = value as File.ComposeFunction<unknown, unknown, object>;
  } else {
    composer = () => value;
  }

  return {
    type: 'json',
    path,
    compose: composer,
    options,
  };
}

export interface CopyOptions {
  /**
   * Copy content as binary, defaults to `false`.
   */
  binary?: boolean;
}

export function copy(
  dir: string,
  patterns: string | string[],
  options?: CopyOptions & {binary: false},
): File.Composable<string, TextFileOptions>[];
export function copy(
  dir: string,
  patterns: string | string[],
  options: CopyOptions & {binary: true},
): File.Composable<Buffer, BinaryFileOptions>[];
export function copy(
  dir: string,
  patterns: string | string[],
  {binary = false}: CopyOptions = {},
): File.Composable<Buffer | string, BinaryFileOptions | TextFileOptions>[] {
  if (!Array.isArray(patterns)) {
    patterns = [patterns];
  }

  let paths = FastGlob.sync(patterns, {
    cwd: dir,
    dot: true,
    onlyFiles: true,
  });

  return paths.map(path => {
    return binary
      ? {
          type: 'binary',
          path,
          compose() {
            return FS.readFileSync(Path.join(dir, path));
          },
        }
      : {
          type: 'text',
          path,
          compose() {
            return FS.readFileSync(Path.join(dir, path), 'utf8');
          },
        };
  });
}
