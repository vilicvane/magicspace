#!/usr/bin/env node

import type * as HTTP from 'http';
import {createRequire} from 'module';
import * as Path from 'path';

import {main} from 'main-function';
import fetch from 'node-fetch';
import ProxyAgent from 'proxy-agent';

import {Extract} from './@utils.js';

const {HTTP_PROXY} = process.env;

const agent = HTTP_PROXY
  ? (new ProxyAgent(HTTP_PROXY) as unknown as HTTP.Agent)
  : undefined;

const require = createRequire(import.meta.url);

main(async () => {
  const {
    url,
    strip = 0,
    dir,
  } = require(Path.resolve('.boilerplate-options.json')) as {
    url: string;
    strip?: number;
    dir?: string;
  };

  const response = await fetch(url, {agent});

  const extractStream = Extract(
    {
      outDir: '.',
      strip,
      dir,
    },
    console.info,
  );

  response.body!.pipe(extractStream);

  await extractStream.promise();
});
