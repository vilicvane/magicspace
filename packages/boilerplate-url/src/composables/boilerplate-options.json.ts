import type {ComposableModuleFunction} from '@magicspace/core';
import {json} from '@magicspace/core';

const composable: ComposableModuleFunction = options =>
  json('.boilerplate-options.json', options);

export default composable;
