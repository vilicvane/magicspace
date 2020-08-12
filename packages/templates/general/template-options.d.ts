declare namespace Magicspace {
  interface TemplateOptions {
    project?: TemplateOptions.ProjectOptions;
  }

  namespace TemplateOptions {
    interface ProjectOptions {
      name: string;
      packagesDir?: string;
      packages?: PackageOptions[];
    }

    interface PackageOptions {
      name: string;
      dir?: string;
    }
  }
}
