import * as FS from 'fs';
import * as Path from 'path';

import FastGlob from 'fast-glob';
import * as Handlebars from 'handlebars';

import {removePathExtension} from './@utils.js';
import type {Composable, ComposeFunction, File} from './file/index.js';
import type {
  BinaryFileOptions,
  JSONFile,
  JSONFileOptions,
  TextFile,
  TextFileOptions,
  YAMLFile,
  YAMLFileOptions,
} from './files/index.js';

export function text(
  path: string,
  content: string | ComposeFunction<TextFile>,
  options?: TextFileOptions,
): Composable<TextFile>;
export function text(
  content: string | ComposeFunction<TextFile>,
  options?: TextFileOptions,
): Composable<TextFile>;
export function text(...args: any[]): Composable<TextFile> {
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
): Composable<JSONFile<TContent>>;
export function json<TContent>(
  value: TContent | ComposeFunction<JSONFile<TContent>>,
  options?: JSONFileOptions,
): Composable<JSONFile<TContent>>;
export function json(...args: any[]): Composable<JSONFile<unknown>> {
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

export function yaml<TContent>(
  path: string,
  value: TContent | ComposeFunction<YAMLFile<TContent>>,
  options?: YAMLFileOptions,
): Composable<YAMLFile<TContent>>;
export function yaml<TContent>(
  value: TContent | ComposeFunction<YAMLFile<TContent>>,
  options?: YAMLFileOptions,
): Composable<YAMLFile<TContent>>;
export function yaml(...args: any[]): Composable<YAMLFile<unknown>> {
  let path: string | undefined;
  let value: unknown;
  let options: YAMLFileOptions;

  if (typeof args[0] === 'string') {
    [path, value, options] = args;
  } else {
    [value, options] = args;
  }

  let composer: ComposeFunction<YAMLFile<unknown>>;

  if (typeof value === 'function') {
    composer = value as ComposeFunction<YAMLFile<unknown>>;
  } else {
    composer = () => value;
  }

  return {
    type: 'yaml',
    path,
    compose: composer,
    options,
  };
}

export type CopyOptions = {
  /**
   * Copy content as binary, defaults to `false`.
   */
  binary?: boolean;
};

export function copy(
  dir: string,
  patterns: string | string[],
  options?: CopyOptions & {binary: false},
): Composable<TextFile>[];
export function copy(
  dir: string,
  patterns: string | string[],
  options: CopyOptions & {binary: true},
): Composable<File<Buffer, BinaryFileOptions>>[];
export function copy(
  dir: string,
  patterns: string | string[],
  {binary = false}: CopyOptions = {},
): (Composable<TextFile> | Composable<File<Buffer, BinaryFileOptions>>)[] {
  if (!Array.isArray(patterns)) {
    patterns = [patterns];
  }

  const paths = FastGlob.sync(patterns, {
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

export type HandlebarsOptions = {
  /**
   * Path to template, defaults to file sibling to the composable module with
   * name `removePathExtension(composableModulePath) + '.hbs'` if not
   * specified.
   */
  template?: string;
  noEscape?: boolean;
};

export function handlebars<TData extends object>(
  path: string,
  data: TData,
  options?: HandlebarsOptions,
): Composable<TextFile>;
export function handlebars<TData extends object>(
  data: TData,
  options?: HandlebarsOptions,
): Composable<TextFile>;
export function handlebars(...args: any[]): Composable<TextFile> {
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
      const templatePath =
        options.template ?? `${removePathExtension(composableModulePath)}.hbs`;

      const template = FS.readFileSync(templatePath, 'utf8');

      return Handlebars.compile(template, {
        noEscape: options.noEscape,
      })(data);
    },
  };
}
