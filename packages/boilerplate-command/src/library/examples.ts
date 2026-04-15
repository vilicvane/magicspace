import type {BoilerplateExample} from '@magicspace/core';

import type {Options} from './boilerplate.js';

export const examples: BoilerplateExample<Options>[] = [
  {
    name: 'vite',
    description: 'Vite Boilerplate',
    options: {
      commands: ['npx create-vite .'],
    },
  },
  {
    name: 'react',
    description: 'React Boilerplate',
    options: {
      commands: ['npx create-react-app .'],
    },
  },
];
