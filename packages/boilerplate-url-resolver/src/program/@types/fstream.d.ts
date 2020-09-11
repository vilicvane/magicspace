declare module 'fstream' {
  import {EventEmitter} from 'events';

  function Writer(options: any): NodeJS.WritableStream;
}
