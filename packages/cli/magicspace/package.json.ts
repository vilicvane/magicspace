import {source} from '@magicspace/core';

export default source(() => {
  return {
    devDependencies: {
      '@magicspace/core': `^${
        require('@magicspace/core/package.json').version
      }`,
      '@magicspace/templates': `^${
        require('@magicspace/templates/package.json').version
      }`,
      magicspace: `^${require('../package.json').version}`,
    },
  };
});
