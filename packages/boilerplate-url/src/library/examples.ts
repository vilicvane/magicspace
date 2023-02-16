import type {BoilerplateExample} from '@magicspace/core';

export const examples: BoilerplateExample[] = [
  {
    name: 'github',
    description: 'GitHub Boilerplate',
    options: {
      url: 'https://github.com/<organization>/<project>/archive/master.zip',
      strip: 1,
    },
  },
  {
    name: 'react-boilerplate',
    description: 'https://github.com/react-boilerplate/react-boilerplate',
    options: {
      url: 'https://github.com/react-boilerplate/react-boilerplate/archive/master.zip',
      strip: 1,
    },
  },
];
