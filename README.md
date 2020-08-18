# Magicspace

Toolkit for living boilerplate.

## Features

- Composable boilerplate mechanism.
- Git-powered conflict resolution for boilerplate update.

## Installation

```bash
npm install --global magicspace

# Install boilerplate package, in this example from GitHub.
npm install --global makeflow/mufan-code-boilerplates
```

## Usage

### Initialize

1. Initialize Git repository and **make initial commit** if you have not.

2. Create magicspace configuration file:

   ```bash
   # Assuming you have installed both `magicspace` and `makeflow/mufan-code-boilerplates` globally.
   magicspace create @mufan/code-boilerplates/general
   ```

   Review the generated `.magicspace/boilerplate.json` file and make relevant changes.

3. Initialize magicspace:

   ```bash
   magicspace init
   ```

   Magicspace will generate an initial patch and merge it into the current branch without committing changes.

4. Review generated changes, resolve conflicts if any (probably none as we are initializing an empty project).

5. Commit changes to complete the merge process initiated by magicspace; otherwise use `git merge --abort` to abort the initialization.

   You would probably want to abort the merge process and initialize magicspace again if you need to make other changes to the configuration file during this process.

### Update

1. After updating the boilerplate package or making changes to the magicspace configuration file:

   ```bash
   magicspace update
   ```

   Magicspace will generate an update patch and merge it into the current branch without committing changes.

2. Review generated changes and resolve conflicts if any.

3. Commit changes to complete the merge process initiated by magicspace; otherwise use `git merge --abort` to abort the update.

## Boilerplate authoring

### Examples

https://github.com/makeflow/mufan-code-boilerplates

### Configuration file

The boilerplate configuration file (`boilerplate.{js,json}`) is basically the same as a magicspace configuration file.

#### Options

- `extends` Optional, a string or an array of strings. Boilerplates to be extended from, resolves using algorithm similar to Node.js module resolution. E.g., you can use something like:

  - `@mufan/code-boilerplates/typescript`
  - `my-published-boilerplate`
  - `../my-local-boilerplate`

  The difference is that it resolves from both the command installation path and the extending configuration file path for non-relative and non-absolute module specifiers.

- `root` Optional, string. Path of the directory containing composable modules, it is also the relative root used with composable module paths to imply generated file paths.
- `composables` Optional, a string array of glob patterns (using [fast-glob](https://github.com/mrmlnc/fast-glob)). See [composable module](#composable-module) for more information.
- `scripts` Optional, an object containing boilerplate lifecycle scripts.

  - `scripts.postgenerate` Optional, executes after magicspace generates content in the temporary directory.

  Those scripts will be executed with `PATH` variable including `node_modules/.bin` of your boilerplate installation. E.g., we are using `prettier --write .` as the `postgenerate` lifecycle script, and `prettier` is a dependency of our boilerplate package.

- `options` Optional, an object or a function. Options in the configuration tree are by default merged shallowly. If a function is provided, an array of the extending options (possibly partially merged) is provided as the first argument, and expecting a merged options for return value. The options are merged from bottom to top, the shallower options overwrites the deeper ones by default.

  A boilerplate author can use it to provide default values for options of the underlaying boilerplates, or just leave it empty for the end-user to configure. Please notice the difference between this and options declaration. See [options declaration file](#options-declaration-file) for more information.

- `examples` Optional, an array of objects. Used to provide example configuration when the end-user runs `magicspace create <boilerplate>`.
  - `examples[].name` Required if not the first example, a string.
  - `examples[].description` Optional.
  - `examples[].options` Optional, an object. The example options to provide.

Checkout `Magicspace.Config` in [types](./packages/core/types.d.ts) for more information.

### Options declaration file

You can declare the options of the boilerplate with `boilerplate.d.ts` file under the boilerplate root directory:

```ts
declare namespace Magicspace {
  interface BoilerplateOptions {
    // ...
  }
}
```

Magicspace will merge all the declarations in configuration tree and validate boilerplate options against type `Magicspace.BoilerplateOptions` using TypeScript API (surprise 🙌).

Of course you can use this type in your own boilerplate project if you are using TypeScript.

### Composable module

Composable module are modules exporting either:

1. A composable object.
2. An array of composable objects.
3. `undefined` if nothing to compose.
4. A function that takes boilerplate options and context object as arguments, and returns either:

   1. A composable object.
   2. An array of composable objects.
   3. `undefined` if nothing to compose.

#### Composable object

- `type` Optional, a string. Currently supported `binary`, `text`, `json`.
- `path` Optional, a string. The relative output path of the composed file. If no path specified, the default output path is implied with `removePathExtension(composableModulePath)` relative to the `root` option in the boilerplate configuration file.
- `compose` Required, a function takes composed content (if any) and compose context object as arguments, and returns updated content.
- `options` Optional, an object. Options for the current composable file type.

Checkout `Composable` in [composable](./packages/core/src/library/file/composable.ts) for more information.

See also composable helpers defined in [composables](./packages/core/src/library/composables.ts).

## License

MIT License.
