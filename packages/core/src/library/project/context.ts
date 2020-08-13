import * as Path from 'path';

import {File} from '../file';

import {Project} from './project';

export class Context {
  private fileMap = new Map<string, File.File<unknown, unknown>>();

  constructor(readonly project: Project, readonly dir: string) {}

  getFile(path: string): File.File<unknown, unknown> | undefined {
    return this.fileMap.get(path);
  }

  ensureFile(
    path: string,
    composable: File.Composable<unknown, unknown>,
  ): File.File<unknown, unknown> {
    let project = this.project;

    let fileMap = this.fileMap;

    let file = fileMap.get(path);

    if (file) {
      project.assertFileObject(file, path, composable.type);
    } else {
      file = project.createFileObject(
        path,
        {
          possibleOutputPath: Path.join(
            project.dir,
            Path.relative(this.dir, path),
          ),
        },
        composable.type,
      );

      fileMap.set(path, file);
    }

    return file;
  }

  async generate(): Promise<void> {
    for (let file of this.fileMap.values()) {
      await file.save();
    }
  }
}
