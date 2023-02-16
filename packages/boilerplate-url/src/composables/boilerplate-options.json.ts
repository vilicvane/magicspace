import type {ComposableBuilder} from '@magicspace/core';
import {json} from '@magicspace/core';

const composable: ComposableBuilder = options =>
  json('.boilerplate-options.json', options);

export default composable;
