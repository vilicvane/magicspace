[![Build Status](https://www.travis-ci.org/makeflow/magicspace.svg?branch=master)](https://www.travis-ci.org/makeflow/magicspace)

# Magicspace

A composable workspace that updates in time.

## Usage

```shell
# Install magicspace command-line tool.

yarn global add magicspace

# Create folder for project `hello-world`

mkdir hello-world
cd hello-world

# Initialize project with basic magicspace configurations.

magicspace init

# Install initial dependencies.

yarn install

# After making changes to `.magicspace/project.ts`

yarn magicspace update

# Install project dependencies

yarn install
```

## References

Check out source code and [packages/templates](packages/templates) for now.

## License

MIT License.
