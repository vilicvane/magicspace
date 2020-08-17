import {DEFAULT_MAGICSPACE_TEMPLATE_DIRNAME} from '@magicspace/core';
import {Options, option} from 'clime';

export class CommonOptions extends Options {
  @option({
    placeholder: 'template-dir',
    default: DEFAULT_MAGICSPACE_TEMPLATE_DIRNAME,
  })
  template!: string;
}
