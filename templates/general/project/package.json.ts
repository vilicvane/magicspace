import {source} from '@magicspace/core';

interface Options {
  packageName: string;
  author: string;
  license: Magicspace.Templates.General.LicenseName | undefined;
}

export default source<Options>(
  ({packageName, author, license}, {placeholder}) => {
    return {
      name: packageName,
      version: placeholder('0.1.0'),
      description: placeholder(''),
      ...(author ? {author} : undefined),
      ...(license ? {license} : undefined),
      ...require('./package.json'),
    };
  },
);
