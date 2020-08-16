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
     * Options are merged using `...` operator, otherwise use a function to handle it manually.
     */
    options?: TemplateOptions | TemplateOptionsMerger;
  }

  interface TemplateOptions {}

  type TemplateOptionsMerger = (
    optionsArray: TemplateOptions[],
  ) => TemplateOptions;
}