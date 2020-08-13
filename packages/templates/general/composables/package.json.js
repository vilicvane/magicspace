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
      ...(packages.length
        ? {
            private: true,
            workspaces: packages.map(package => package.dir),
          }
        : {
            version: '0.0.0',
          }),
    }),
    ...packages.map(package =>
      json(Path.join(package.dir, 'package.json'), {
        name: package.name,
        version: '0.0.0',
      }),
    ),
  ];
};
