export interface RawConfig {
  /**
   * Path to other magicspace template packages or directories containing
   * `template.json` or `template.js` file.
   *
   * E.g.:
   *
   * - `@magicspace/templates/general`
   * - `awesome-template`
   * - `../my-template`
   *
   * @link https://github.com/vilic/module-lens
   */
  extends?: string[];
  /**
   * Root directory of composable files.
   */
  root?: string;
  /**
   * Composable file patterns.
   *
   * @link https://github.com/isaacs/node-glob
   */
  files?: string[];
  /**
   * Options are merged using `...` operator, otherwise use a function to handle it manually.
   */
  options?: Magicspace.TemplateOptions | TemplateOptionsMerger;
}

export type TemplateOptionsMerger = (
  optionsArray: Magicspace.TemplateOptions[],
) => Magicspace.TemplateOptions;
