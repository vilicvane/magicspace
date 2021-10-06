#!/usr/bin/env node

import * as Path from 'path';

// eslint-disable-next-line @mufan/import-groups
process.env.GLOBAL_AGENT_ENVIRONMENT_VARIABLE_NAMESPACE = '';

import 'global-agent/bootstrap';

import {CLI, Shim} from 'clime';

let cli = new CLI('magicspace', Path.join(__dirname, 'commands'));

let shim = new Shim(cli);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
shim.execute(process.argv);
