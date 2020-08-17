import {DEFAULT_MAGICSPACE_BOILERPLATE_DIRNAME} from '@magicspace/core';
import {Options, option} from 'clime';

export class CommonOptions extends Options {
  @option({
    placeholder: 'boilerplate-dir',
    default: DEFAULT_MAGICSPACE_BOILERPLATE_DIRNAME,
  })
  boilerplate!: string;
}
