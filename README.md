[![MIT License](https://img.shields.io/badge/license-MIT-999999?style=flat-square)](./LICENSE)
[![Discord](https://img.shields.io/badge/chat-discord-5662f6?style=flat-square)](https://discord.gg/vanVrDwSkS)

# Magicspace

Toolkit for living boilerplate.

## Features

- Composable boilerplate mechanism.
- Git-powered conflict resolution for boilerplate update.

## Installation

```bash
npm install --global magicspace

# Install a boilerplate package
npm install --global @mufan/code-boilerplates
```

## Usage

### Initialize

1. Initialize Git repository.

2. Create magicspace configuration file:

   ```bash
   # Assuming you have installed both `magicspace` and `makeflow/mufan-code-boilerplates` globally.
   magicspace create @mufan/code-boilerplates/general --schema
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

- [Boilerplate URL](packages/boilerplate-url)
- [Mufan Code Boilerplates](https://github.com/makeflow/mufan-code-boilerplates)

## License

MIT License.
