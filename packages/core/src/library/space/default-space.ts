import {BinaryFile, JSONFile, TextFile} from '../files';

import {FileObjectCreator} from './space';

export const DEFAULT_MAGICSPACE_BOILERPLATE_DIRNAME = '.magicspace';

export const DEFAULT_FILE_OBJECT_CREATOR_MAP = new Map<
  string | undefined,
  FileObjectCreator
>([
  [undefined, (path, context) => new TextFile(path, context)],
  ['text', (path, context) => new TextFile(path, context)],
  ['binary', (path, context) => new BinaryFile(path, context)],
  ['json', (path, context) => new JSONFile(path, context)],
]);

export const DEFAULT_EXTENSION_TO_FILE_TYPE_MAP = new Map<string, string>([
  ['.json', 'json'],
]);
