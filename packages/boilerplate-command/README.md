[![NPM version](https://img.shields.io/npm/v/@magicspace/boilerplate-command?color=%23cb3837&style=flat-square)](https://www.npmjs.com/package/@magicspace/boilerplate-command)
[![MIT License](https://img.shields.io/badge/license-MIT-999999?style=flat-square)](./LICENSE)
[![Discord](https://img.shields.io/badge/chat-discord-5662f6?style=flat-square)](https://discord.gg/vanVrDwSkS)

# @magicspace/boilerplate-command

A magicspace boilerplate that wraps CLI scaffolding tools (like `create-vite`, `create-react-app`, etc.) into living boilerplates — so you can track upstream template changes with Git-powered conflict resolution.

## Installation

```bash
npm install --global magicspace @magicspace/boilerplate-command
```

## Quick Start

```bash
git init my-vite-app && cd my-vite-app

# Create config (select the "vite" example when prompted)
magicspace create @magicspace/boilerplate-command

# Generate initial project files
magicspace init
```

Review and commit the generated changes. Since this boilerplate exports typed options, magicspace also generates `.magicspace/boilerplate.schema.json` by default. Later, run `magicspace update` to pull in upstream template updates and `magicspace update-schema` if you need to refresh the generated config schema.

## Built-in Examples

| Name    | Command                  |
| ------- | ------------------------ |
| `vite`  | `npx create-vite .`      |
| `react` | `npx create-react-app .` |

## Custom Commands

Interactive scaffolding is fully supported and is often the simplest way to wrap an existing generator. For example, this keeps Vite's normal prompt-driven flow:

```json
{
  "boilerplate": "@magicspace/boilerplate-command",
  "options": {
    "commands": ["npx create-vite ."]
  }
}
```

If you want a more reproducible setup for later `magicspace update` runs, you can also pass explicit arguments. For example, a Vite React TypeScript project:

```json
{
  "boilerplate": "@magicspace/boilerplate-command",
  "options": {
    "commands": [
      {
        "command": "npx",
        "args": ["create-vite", ".", "--template", "react-ts"]
      }
    ]
  }
}
```

Each entry in `commands` can be either a shell command string or an object with `command` and optional `args`.

## License

MIT License.
