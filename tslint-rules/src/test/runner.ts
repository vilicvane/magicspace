// tslint:disable:no-implicit-dependencies

import * as Path from 'path';

import * as glob from 'glob';
import {consoleTestResultHandler, runTest} from 'tslint/lib/test';

console.log('Testing Lint Rules:');

let testDirs = glob
  .sync('../../test/rules/**/tslint.json', {cwd: __dirname, absolute: true})
  .map(path => Path.dirname(path));

let allPassed = true;

for (let testDir of testDirs) {
  let results = runTest(testDir);
  let passed = consoleTestResultHandler(results, console);

  if (!passed) {
    allPassed = false;
  }
}

process.exit(allPassed ? 0 : 1);
