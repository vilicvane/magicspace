const Path = require('path');

const {json} = require('@magicspace/core');

module.exports = ({
  project,
  project: {packagesDir = 'packages', packages = []} = {},
}) => {
  packages = packages.map(package => {
    return {
      ...package,
      dir: Path.join(
        packagesDir,
        package.dir || package.name.replace(/^@[^/]+/, ''),
      ),
    };
  });

  return [
    json('package.json', {
      name: project.name,
      version: '0.0.0',
      workspaces: packages.length
        ? packages.map(package => package.dir)
        : undefined,
    }),
    ...packages.map(package =>
      json(Path.join(package.dir, 'package.json'), {
        name: package.name,
        version: '0.0.0',
      }),
    ),
  ];
};
