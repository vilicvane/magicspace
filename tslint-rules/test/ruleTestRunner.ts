import * as path from 'path';

// tslint:disable-next-line:no-implicit-dependencies
import * as glob from 'glob';

import {consoleTestResultHandler, runTest} from 'tslint/lib/test';

process.stdout.write('\nTesting Lint Rules:\n');

const testDirectories = glob
  .sync('./test/rules/**/tslint.json')
  .map(path.dirname);

for (const testDirectory of testDirectories) {
  const results = runTest(testDirectory);
  const didAllTestsPass = consoleTestResultHandler(results, {
    log(m) {
      process.stdout.write(m);
    },
    error(m) {
      process.stderr.write(m);
    },
  });
  if (!didAllTestsPass) {
    process.exitCode = 1;
    break;
  }
}
