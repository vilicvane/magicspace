import * as Path from 'path';
import {fileURLToPath} from 'url';

import {boilerplate, composables, x} from '@magicspace/core';

export const Options = x.object({
  url: x.string,
  strip: x.number.optional(),
  dir: x.string.optional(),
});

export type Options = x.TypeOf<typeof Options>;

export default boilerplate<Options>(async options => {
  return {
    composables: await composables(
      {
        root: Path.join(fileURLToPath(import.meta.url), '../../composables'),
        pattern: '*.js',
      },
      options,
    ),
    scripts: {
      postgenerate:
        'boilerplate-url-resolver && rimraf .boilerplate-options.json',
    },
  };
});
