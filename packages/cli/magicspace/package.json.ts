import {resolve} from 'module-lens';

import {source} from '@magicspace/core';

export default source(() => {
  let corePackageJSONFilePath = resolve('@magicspace/core/package.json', {
    sourceFileName: __filename,
  })!;

  let templatesPackageJSONFilePath = resolve(
    '@magicspace/templates/package.json',
    {
      sourceFileName: __filename,
    },
  )!;

  return {
    devDependencies: {
      '@magicspace/core': `^${require(corePackageJSONFilePath).version}`,
      '@magicspace/templates': `^${
        require(templatesPackageJSONFilePath).version
      }`,
      magicspace: `^${require('../package.json').version}`,
    },
  };
});
