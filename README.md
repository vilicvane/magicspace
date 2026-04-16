[![MIT License](https://img.shields.io/badge/license-MIT-999999?style=flat-square)](./LICENSE)
[![Discord](https://img.shields.io/badge/chat-discord-5662f6?style=flat-square)](https://discord.gg/vanVrDwSkS)

# Magicspace

Toolkit for living boilerplate.

## Features

- Composable boilerplate mechanism.
- Git-powered conflict resolution for boilerplate update.
- Wrap common template tools (like `create-vite`) as living boilerplates with [`@magicspace/boilerplate-command`](packages/boilerplate-command).

## Quick Start with Scaffolding Tools like Vite

1. Install magicspace and the boilerplate-command package globally:

   ```bash
   npm install --global magicspace @magicspace/boilerplate-command
   ```

2. Initialize a Git repository and create a magicspace configuration:

   ```bash
   git init my-vite-app && cd my-vite-app

   magicspace create @magicspace/boilerplate-command
   ```

   Select an example and update the generated `.magicspace/boilerplate.json` if needed. When the boilerplate exports typed options, magicspace also generates `.magicspace/boilerplate.schema.json` and wires `$schema` automatically. For vite, the config would look like this:

   ```json
   {
     "$schema": "boilerplate.schema.json",
     "boilerplate": "@magicspace/boilerplate-command",
     "options": {
       "commands": ["npx create-vite ."]
     }
   }
   ```

3. Initialize magicspace:

   ```bash
   magicspace init
   ```

4. Review generated changes and commit to complete the merge.

Now whenever Vite releases a template update, simply run `magicspace update` to get a clean, conflict-aware diff merged into your project.

![magicspace update](https://raw.githubusercontent.com/vilicvane/magicspace/5450526ac90442c715190ee978b76970a08b3ab1/res/magicspace-update.png)

## Installation

```bash
npm install --global magicspace
```

## Usage

### Initialize

1. Initialize Git repository.

2. Create magicspace configuration file:

   ```bash
   magicspace create <boilerplate>
   ```

   If the boilerplate exports typed options, magicspace generates `.magicspace/boilerplate.schema.json` by default and adds `$schema` to `.magicspace/boilerplate.json`.

   For example, with a custom boilerplate package:

   ```bash
   npm install --global @mufan/code-boilerplates
   magicspace create @mufan/code-boilerplates/typescript
   ```

   Or with `@magicspace/boilerplate-command` to wrap any scaffolding CLI:

   ```bash
   npm install --global @magicspace/boilerplate-command
   magicspace create @magicspace/boilerplate-command
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

> You may use `magicspace create` + `magicspace init --force` to initialize magicspace for an existing project. In this case, there may be conflicts to resolve during the initial merge. Just review the generated changes and resolve conflicts as you would with any Git merge.
>
> To keep everything ours during `magicspace init`, you can also use `magicspace init --force --ours` to automatically resolve conflicts in favor of the current branch.

### Update

1. After updating the boilerplate package or making changes to the magicspace configuration file:

   ```bash
   magicspace update
   ```

   Magicspace will generate an update patch and merge it into the current branch without committing changes.

2. Review generated changes and resolve conflicts if any.

3. Commit changes to complete the merge process initiated by magicspace; otherwise use `git merge --abort` to abort the update.

### Update Schema

If the boilerplate package changes its option shape or you want to refresh `.magicspace/boilerplate.schema.json`, run:

```bash
magicspace update-schema
```

This updates the generated JSON schema for single-boilerplate configs without changing project files.

## Boilerplate authoring

### Examples

- [@mufan/code-boilerplates](https://github.com/makeflow/mufan-code-boilerplates) the magicspace boilerplates widely used in our projects, keeps project configurations and structures up-to-date cross years.

## License

MIT License.
