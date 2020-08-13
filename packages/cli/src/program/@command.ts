import {Options, option} from 'clime';

import {DEFAULT_MAGICSPACE_TEMPLATE_DIRNAME} from './@constants';

export class CommonOptions extends Options {
  @option({
    placeholder: 'template-dir',
    default: DEFAULT_MAGICSPACE_TEMPLATE_DIRNAME,
  })
  template!: string;

  @option({
    toggle: true,
    default: false,
  })
  force!: boolean;
}
