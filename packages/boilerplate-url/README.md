[![NPM version](https://img.shields.io/npm/v/@magicspace/boilerplate-url?color=%23cb3837&style=flat-square)](https://www.npmjs.com/package/@magicspace/boilerplate-url)
[![MIT License](https://img.shields.io/badge/license-MIT-999999?style=flat-square)](./LICENSE)
[![Discord](https://img.shields.io/badge/chat-discord-5662f6?style=flat-square)](https://discord.gg/vanVrDwSkS)

# Boilerplate URL

A [magicspace](https://github.com/makeflow/magicspace) boilerplate that downloads content from URL.

Currently supports only `zip` format.

## Usage

```bash
npm install --global magicspace @magicspace/boilerplate-url

magicspace create @magicspace/boilerplate-url
```

## Example

```json
{
  "extends": "@magicspace/boilerplate-url",
  "options": {
    "url": "https://github.com/react-boilerplate/react-boilerplate/archive/master.zip",
    "strip": 1
  }
}
```

## License

MIT License.
