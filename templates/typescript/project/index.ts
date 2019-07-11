// tslint:disable: scoped-modules

import {TemplateConfig, bundle} from '@magicspace/core';
import _ from 'lodash';

import {keys as prioritizedPackageKeys} from '../../general/package';

export default bundle({
  extends: ['../../general/project'],
  templates({}, {packageFiles, projectType = 'library', projectTargets = []}) {
    switch (projectType) {
      case 'library':
        if (!packageFiles) {
          packageFiles = ['src/library/**/*.ts', 'bld/library'];
        }

        projectTargets.push({
          name: 'library',
          packageExtension: {
            main: 'library/bld/index.js',
            types: 'library/bld/index.d.ts',
          },
          compilerOptions: {
            declaration: true,
          },
        });
        break;
      case 'program':
        projectTargets.push({
          name: 'program',
        });
      case 'none':
        break;
      default:
        throw new Error(`Unknown project type "${projectType}"`);
    }

    return _.compact([
      {
        source: {
          type: 'module',
          filePath: 'package.json.ts',
        },
        destination: {
          type: 'json',
          filePath: '<project>/package.json',
          spread: true,
          mergeStrategy: 'deep',
          sort: prioritizedPackageKeys,
        },
      },
      packageFiles
        ? {
            source: {
              type: 'inline',
              content: packageFiles,
            },
            destination: {
              type: 'json',
              filePath: '<project>/package.json',
              propertyPath: ['files'],
            },
          }
        : undefined,
      ..._.flatMap(
        projectTargets,
        ({
          name,
          packageExtension,
          compilerOptions = {},
        }): (TemplateConfig | undefined)[] => [
          packageExtension
            ? {
                source: {
                  type: 'inline',
                  content: packageExtension,
                },
                destination: {
                  type: 'json',
                  filePath: '<project>/package.json',
                  spread: true,
                  mergeStrategy: 'deep',
                },
              }
            : undefined,
          {
            source: {
              type: 'module',
              filePath: 'tsconfig.json.ts',
              options: {
                compilerOptions: {
                  ...compilerOptions,
                  rootDir: '.',
                  outDir: (compilerOptions as any).noEmit
                    ? undefined
                    : `../bld/${name}`,
                },
              },
            },
            destination: {
              type: 'json',
              filePath: `<project>/src/${name}/tsconfig.json`,
              spread: true,
            },
          },
          {
            source: {
              type: 'module',
              filePath: 'tslint.json.ts',
            },
            destination: {
              type: 'json',
              filePath: `<project>/src/${name}/tslint.json`,
            },
          },
        ],
      ),
    ]);
  },
});
