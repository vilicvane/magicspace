import {BinaryFile, JSONFile, TextFile, YAMLFile} from '../files/index.js';

import type {FileObjectCreator} from './space.js';

export const DEFAULT_MAGICSPACE_DIRNAME = '.magicspace';

export const DEFAULT_FILE_OBJECT_CREATOR_MAP = new Map<
  string | undefined,
  FileObjectCreator
>([
  [undefined, (path, context) => new TextFile(path, context)],
  ['text', (path, context) => new TextFile(path, context)],
  ['binary', (path, context) => new BinaryFile(path, context)],
  ['json', (path, context) => new JSONFile(path, context)],
  ['yaml', (path, context) => new YAMLFile(path, context)],
]);

export const DEFAULT_EXTENSION_TO_FILE_TYPE_MAP = new Map<string, string>([
  ['.json', 'json'],
  ['.yaml', 'yaml'],
  ['.yml', 'yaml'],
]);
