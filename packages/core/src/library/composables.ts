import * as FS from 'fs';
import * as Path from 'path';

import * as FastGlob from 'fast-glob';
import * as Handlebars from 'handlebars';

import {
  BinaryFileOptions,
  JSONFile,
  JSONFileOptions,
  TextFile,
  TextFileOptions,
} from './@files';
import {removePathExtension} from './@utils';
import {Composable, ComposeFunction} from './file';

export function text(
  path: string,
  content: string | ComposeFunction<TextFile>,
  options?: TextFileOptions,
): Composable<string, TextFileOptions>;
export function text(
  content: string | ComposeFunction<TextFile>,
  options?: TextFileOptions,
): Composable<string, TextFileOptions>;
export function text(...args: any[]): Composable<string, TextFileOptions> {
  let path: string | undefined;
  let content: string;
  let options: TextFileOptions;

  if (typeof args[1] === 'string' || typeof args[1] === 'function') {
    [path, content, options] = args;
  } else {
    [content, options] = args;
  }

  let composer: ComposeFunction<TextFile>;

  if (typeof content === 'function') {
    composer = content as ComposeFunction<TextFile>;
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

export function json<TContent>(
  path: string,
  value: TContent | ComposeFunction<JSONFile<TContent>>,
  options?: JSONFileOptions,
): Composable<TContent, JSONFileOptions>;
export function json<TContent>(
  value: TContent | ComposeFunction<JSONFile<TContent>>,
  options?: JSONFileOptions,
): Composable<TContent, JSONFileOptions>;
export function json(...args: any[]): Composable<unknown, JSONFileOptions> {
  let path: string | undefined;
  let value: unknown;
  let options: JSONFileOptions;

  if (typeof args[0] === 'string') {
    [path, value, options] = args;
  } else {
    [value, options] = args;
  }

  let composer: ComposeFunction<JSONFile<unknown>>;

  if (typeof value === 'function') {
    composer = value as ComposeFunction<JSONFile<unknown>>;
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
): Composable<string, TextFileOptions>[];
export function copy(
  dir: string,
  patterns: string | string[],
  options: CopyOptions & {binary: true},
): Composable<Buffer, BinaryFileOptions>[];
export function copy(
  dir: string,
  patterns: string | string[],
  {binary = false}: CopyOptions = {},
): Composable<Buffer | string, BinaryFileOptions | TextFileOptions>[] {
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

export interface HandlebarsOptions {
  /**
   * Path to template, defaults to file sibling to the composable module with
   * name `removePathExtension(composableModulePath) + '.hbs'` if not
   * specified.
   */
  template?: string;
  noEscape?: boolean;
}

export function handlebars<TData>(
  path: string,
  data: TData,
  options?: HandlebarsOptions,
): Composable<string, TextFileOptions>;
export function handlebars<TData>(
  data: TData,
  options?: HandlebarsOptions,
): Composable<string, TextFileOptions>;
export function handlebars(
  ...args: any[]
): Composable<string, TextFileOptions> {
  let path: string | undefined;
  let data: unknown;
  let options: HandlebarsOptions;

  if (typeof args[0] === 'string') {
    [path, data, options = {}] = args;
  } else {
    [data, options = {}] = args;
  }

  return {
    type: 'text',
    path,
    compose(_content, {composableModulePath}) {
      let templatePath =
        options.template ?? `${removePathExtension(composableModulePath)}.hbs`;

      let template = FS.readFileSync(templatePath, 'utf8');

      return Handlebars.compile(template, {
        noEscape: options.noEscape,
      })(data);
    },
  };
}
