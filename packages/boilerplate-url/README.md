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
