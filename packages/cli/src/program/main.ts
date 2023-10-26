#!/usr/bin/env node

import {fileURLToPath} from 'url';

import {CLI, Shim} from 'clime';
import {bootstrap} from 'global-agent';

bootstrap({
  environmentVariableNamespace: '',
});

const cli = new CLI(
  'magicspace',
  fileURLToPath(new URL('commands', import.meta.url)),
);

const shim = new Shim(cli);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
shim.execute(process.argv);
