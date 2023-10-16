import * as Path from 'path';

import type {BoilerplateComposable} from '../boilerplate';
import type {File} from '../file';

import type {Space} from './space';

export class Context {
  private fileMap = new Map<string, File>();

  constructor(
    readonly space: Space,
    readonly dir: string,
  ) {}

  getFile(path: string): File | undefined {
    return this.fileMap.get(path);
  }

  ensureFile(path: string, composable: BoilerplateComposable): File {
    const space = this.space;

    const fileMap = this.fileMap;

    let file = fileMap.get(path);

    if (file) {
      space.assertFileObject(file, path, composable.type);
    } else {
      file = space.createFileObject(
        path,
        {
          outputPath: Path.join(space.dir, Path.relative(this.dir, path)),
        },
        composable.type,
      );

      fileMap.set(path, file);
    }

    return file;
  }

  async generate(): Promise<void> {
    for (const file of this.fileMap.values()) {
      await file.save();
    }
  }
}
