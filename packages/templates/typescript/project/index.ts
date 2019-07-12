import {TemplateConfig, bundle} from '@magicspace/core';
import _ from 'lodash';

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
            main: 'bld/library/index.js',
            types: 'bld/library/index.d.ts',
          },
          compilerOptions: {
            declaration: true,
          },
          templates: [
            {
              source: {
                type: 'inline',
                content: '',
                placeholder: true,
              },
              destination: {
                type: 'text',
                filePath: '<project>/src/library/index.ts',
              },
            },
          ],
        });
        break;
      case 'program':
        projectTargets.push({
          name: 'program',
        });
        break;
      case 'none':
        break;
      default:
        throw new Error(`Unknown project type "${projectType}"`);
    }

    return _.compact([
      {
        source: {
          type: 'json',
          filePath: 'package.json.json',
          propertyPath: ['dependencies'],
        },
        destination: {
          type: 'json',
          filePath: '<project>/package.json',
          propertyPath: ['dependencies'],
          mergeStrategy: 'shallow',
          spread: true,
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
          development = false,
          packageExtension,
          compilerOptions = {},
          templates = [],
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
                  mergeStrategy: 'shallow',
                  spread: true,
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
                    : `../../bld/${name}`,
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
              options: {
                development,
              },
            },
            destination: {
              type: 'json',
              filePath: `<project>/src/${name}/tslint.json`,
            },
          },
          ...templates,
        ],
      ),
    ]);
  },
});
