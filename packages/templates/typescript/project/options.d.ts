/// <reference path="../../general/project/options.d.ts" />

declare namespace Magicspace {
  namespace Templates.TypeScript {
    type ProjectType = 'library' | 'program' | 'none';

    interface ProjectTarget {
      name: string;
      development?: boolean;
      packageExtension?: object;
      compilerOptions?: object;
    }
  }

  interface TemplateBundleOptions {
    packageFiles: string[];
    projectType: Templates.TypeScript.ProjectType;
    projectTargets: Templates.TypeScript.ProjectTarget[];
  }
}
