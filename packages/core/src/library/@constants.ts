import * as Path from 'path';

export const PACKAGE_DIR = Path.join(__dirname, '../..');

export const TEMP_MAGIC_REPOSITORY_DIR = Path.join(PACKAGE_DIR, '.magicspace');

export const MAGICSPACE_REMOTE = 'magicspace';
export const MAGICSPACE_BRANCH = 'magicspace';

export const MAGICSPACE_INITIALIZE_COMMIT_MESSAGE = '(magicspace-initialize)';
export const MAGICSPACE_UPDATE_COMMIT_MESSAGE = '(magicspace-update)';

export const MAGICSPACE_INITIALIZE_MERGE_MESSAGE =
  'Merge magicspace changes (initialize)';
export const MAGICSPACE_UPDATE_MERGE_MESSAGE =
  'Merge magicspace changes (update)';

export const MAGIC_COMMIT_MESSAGE_REGEX_STRING = '\\(magicspace-.*\\)';

export const DIRECTORY_DETECTION_FIND_RENAMES_THRESHOLD = '10%';
export const PULL_FIND_RENAMES_THRESHOLD = '10%';
