/// <reference path="../general/options.d.ts" />

declare namespace Magicspace {
  namespace Templates {
    namespace General {
      type LicenseName = 'MIT';
    }
  }

  interface TemplateBundleOptions {
    packageName: string;
    author: string;
    license: Templates.General.LicenseName;
    copyrightYear: string;
  }
}
