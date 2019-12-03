#!/usr/bin/env node

import * as Path from 'path';

import {registerTSNode} from '@magicspace/core';
import {CLI, Shim} from 'clime';

registerTSNode();

let cli = new CLI('magicspace', Path.join(__dirname, 'commands'));

let shim = new Shim(cli);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
shim.execute(process.argv);
