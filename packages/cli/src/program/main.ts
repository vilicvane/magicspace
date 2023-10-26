#!/usr/bin/env node

import * as Path from 'path';

process.env.GLOBAL_AGENT_ENVIRONMENT_VARIABLE_NAMESPACE = '';

import 'global-agent/bootstrap';

import {CLI, Shim} from 'clime';

const cli = new CLI('magicspace', Path.join(__dirname, 'commands'));

const shim = new Shim(cli);

// eslint-disable-next-line @typescript-eslint/no-floating-promises
shim.execute(process.argv);
