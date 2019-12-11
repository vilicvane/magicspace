import * as Path from 'path';
import * as FS from 'fs';

console.log(FS.readFileSync(Path.join(__dirname, './tsconfig.json')));
