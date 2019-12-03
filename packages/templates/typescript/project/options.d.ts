/// <reference path="../../general/project/options.d.ts" />

import {TemplateConfig} from '@magicspace/core';

declare global {
  namespace Magicspace {
    namespace Templates {
      namespace TypeScript {
        type ProjectType = 'library' | 'program' | 'none';

        interface ProjectTarget {
          name: string;
          development?: boolean;
          packageExtension?: object;
          compilerOptions?: object;
          templates?: TemplateConfig[];
        }
      }
    }

    interface TemplateBundleOptions {
      packageFiles: string[];
      projectType: Templates.TypeScript.ProjectType;
      projectTargets: Templates.TypeScript.ProjectTarget[];
    }
  }
}
