// tslint:disable:import-groups
import * as Path from 'path';

import 'source-map-support/register';

import * as glob from 'glob';
import {consoleTestResultHandler, runTest} from 'tslint/lib/test';

let pattern = process.argv[2];

console.info('Testing Lint Rules:');

let testDirNames = glob
  .sync('../../test/rules/**/tslint.json', {cwd: __dirname, absolute: true})
  .filter(path => !pattern || path.includes(pattern))
  .map(path => Path.dirname(path));

let allPassed = true;

for (let testDirName of testDirNames) {
  let result = runTest(testDirName);

  let passed = consoleTestResultHandler(result, console);

  if (!passed) {
    allPassed = false;
  }
}

process.exit(allPassed ? 0 : 1);
