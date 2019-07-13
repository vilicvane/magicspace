import {source} from '@magicspace/core';

interface Options {
  repository: string | undefined;
  author: string | undefined;
  license: Magicspace.Templates.General.LicenseName | undefined;
}

export default source<Options>(({repository, author, license}, {}) => {
  return {
    ...(repository ? {repository} : undefined),
    ...(author ? {author} : undefined),
    ...(license ? {license} : undefined),
  };
});
