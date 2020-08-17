declare namespace Magicspace {
  interface Config {
    /**
     * Path to other magicspace template packages or directories containing
     * `template.json` or `template.js` file.
     *
     * E.g.:
     *
     * - `@mufan/code-templates/general`
     * - `awesome-template`
     * - `../my-template`
     *
     * @link https://github.com/vilic/module-lens
     */
    extends?: string | string[];
    /**
     * Root directory of composable files.
     */
    root?: string;
    /**
     * Composable file patterns.
     *
     * @link https://github.com/mrmlnc/fast-glob
     */
    composables?: string[];
    /**
     * Template lifecycle scripts.
     */
    scripts?: TemplateScripts;
    /**
     * Options are merged using `...` operator, otherwise use a function to handle it manually.
     */
    options?: TemplateOptions | TemplateOptionsMerger;
    /**
     * Example configurations for `magicspace create` command.
     */
    examples?: [DefaultExampleOptions, ...ExampleOptions[]];
  }

  interface TemplateScripts {
    /**
     * Script to run after generating files during magicspace branch preparation.
     */
    postgenerate?: string;
  }

  interface TemplateOptions {}

  interface DefaultExampleOptions {
    name?: string;
    description?: string;
    options?: TemplateOptions;
  }

  interface ExampleOptions {
    name: string;
    description?: string;
    options?: TemplateOptions;
  }

  type TemplateOptionsMerger = (
    optionsArray: TemplateOptions[],
  ) => TemplateOptions;
}
