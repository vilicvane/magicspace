import {File} from '../file';

import {Project} from './project';

export class Context {
  private fileMap = new Map<string, File.File<unknown, unknown>>();

  constructor(readonly project: Project) {}

  getFile(path: string): File.File<unknown, unknown> | undefined {
    return this.fileMap.get(path);
  }

  ensureFile(
    path: string,
    composable: File.Composable<unknown, unknown>,
  ): File.File<unknown, unknown> {
    let fileMap = this.fileMap;

    let file = fileMap.get(path);

    if (!file) {
      file = this.project.createFileObject(path, composable.type);
      fileMap.set(path, file);
    }

    return file;
  }

  generate(): void {
    for (let file of this.fileMap.values()) {
      file.save();
    }
  }
}
