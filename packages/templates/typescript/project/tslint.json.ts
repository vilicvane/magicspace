import {source} from '@magicspace/core';
import _ from 'lodash';

interface Options {
  development: boolean;
}

export default source<Options>(({development}) => {
  return {
    extends: _.compact([
      '@magicspace/configs/tslint-prettier',
      development ? '@magicspace/configs/tslint-override-dev' : undefined,
    ]),
  };
});
