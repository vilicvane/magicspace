import {composable, json} from '@magicspace/core';

import type {Options} from '../library';

export default composable<Options>(options =>
  json('.boilerplate-options.json', options),
);
