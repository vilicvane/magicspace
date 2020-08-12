import {BinaryFile, JSONFile, TextFile} from '../@files';
import {resolveTemplateConfig} from '../config/config';

import {FileObjectCreator, Project} from './project';

export const DEFAULT_FILE_OBJECT_CREATOR_MAP = new Map<
  string | undefined,
  FileObjectCreator
>([
  [undefined, path => new TextFile(path)],
  ['text', path => new TextFile(path)],
  ['binary', path => new BinaryFile(path)],
  ['json', path => new JSONFile(path)],
]);

export const DEFAULT_EXTENSION_TO_FILE_TYPE_MAP = new Map<string, string>([
  ['.json', 'json'],
]);

export function createDefaultProject(
  projectDir: string,
  templateDir: string,
): Project {
  let config = resolveTemplateConfig(templateDir);

  return new Project(
    DEFAULT_FILE_OBJECT_CREATOR_MAP,
    DEFAULT_EXTENSION_TO_FILE_TYPE_MAP,
    projectDir,
    config,
  );
}
