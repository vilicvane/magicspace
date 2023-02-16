import {DEFAULT_MAGICSPACE_DIRNAME} from '@magicspace/core';
import {Options, option} from 'clime';

export class CommonOptions extends Options {
  @option({
    placeholder: 'magicspace-dir',
    default: DEFAULT_MAGICSPACE_DIRNAME,
  })
  magicspace!: string;
}
