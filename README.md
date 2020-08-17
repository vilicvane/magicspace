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

1. Initialize repository and **make initial commit** if you have not.

2. Create magicspace configuration file:

   ```bash
   # Assuming you have installed `makeflow/mufan-code-boilerplates` globally.
   magicspace create @mufan/code-boilerplates/general
   ```

   Review the generated `.magicspace/boilerplate.json` and make relevant changes.

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

   Review generated changes and resolve conflicts if any.

2. Commit changes to complete the merge process initiated by magicspace; otherwise use `git merge --abort` to abort the update.

## Boilerplate authoring

### Examples

https://github.com/makeflow/mufan-code-boilerplates

### Configuration file

The boilerplate configuration file (`boilerplate.json`/`boilerplate.js`) is exactly the same as a magicspace configuration file.

Checkout `Magicspace.Config` in [types](./packages/core/types.d.ts) for more information.

### Options declaration file

Declare the options of your boilerplate with `boilerplates.d.ts` file:

```ts
declare namespace Magicspace {
  interface BoilerplateOptions {
    // ...
  }
}
```

Magicspace will validate boilerplate options against this type.

### Composable module

Checkout `Composable` in [composable](./packages/core/src/library/file/composable.ts) for more information.

See also composable helpers defined in [composables](./packages/core/src/library/composables.ts).

## License

MIT License.
