declare namespace Magicspace {
  interface Config {
    /**
     * Path to other magicspace boilerplate packages or directories containing
     * `boilerplate.json` or `boilerplate.js` file.
     *
     * E.g.:
     *
     * - `@mufan/code-boilerplates/general`
     * - `awesome-boilerplate`
     * - `../my-boilerplate`
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
     * Boilerplate lifecycle scripts.
     */
    scripts?: BoilerplateScripts;
    /**
     * Options are merged using `...` operator, otherwise use a function to handle it manually.
     */
    options?: BoilerplateOptions | BoilerplateOptionsMerger;
    /**
     * Example configurations for `magicspace create` command.
     */
    examples?: [DefaultExampleOptions, ...ExampleOptions[]];
  }

  interface BoilerplateScripts {
    /**
     * Script to run after generating files during magicspace branch preparation.
     */
    postgenerate?: string;
  }

  interface BoilerplateOptions {}

  interface DefaultExampleOptions {
    name?: string;
    description?: string;
    options?: BoilerplateOptions;
  }

  interface ExampleOptions {
    name: string;
    description?: string;
    options?: BoilerplateOptions;
  }

  type BoilerplateOptionsMerger = (
    optionsArray: BoilerplateOptions[],
  ) => BoilerplateOptions;
}
