import * as Path from 'path';
import {Writable} from 'stream';

import duplexer2 from 'duplexer2';
import {Writer} from 'fstream';
import {Parse, ParseStream} from 'unzipper';

export interface ExtractOptions {
  path: string;
  strip?: number;
}

export function Extract(
  {path, strip = 0}: ExtractOptions,
  onEntry: (path: string) => void,
): ParseStream {
  let parser = Parse();

  let outStream = new Writable({objectMode: true});

  outStream._write = function (entry, _encoding, callback) {
    if (entry.type === 'Directory') {
      callback();
      return;
    }

    let strippedPath = entry.path.split('/').slice(strip).join('/');

    onEntry(strippedPath);

    let extractPath = Path.join(path, strippedPath);

    let writer = Writer({path: extractPath});

    entry.pipe(writer).on('error', callback).on('close', callback);
  };

  let extract = duplexer2(parser, outStream as any) as ParseStream;

  parser.once('crx-header', function (crxHeader) {
    (extract as any).crxHeader = crxHeader;
  });

  parser.pipe(outStream).on('finish', function () {
    extract.emit('close');
  });

  extract.promise = function () {
    return new Promise(function (resolve, reject) {
      extract.on('close', resolve);
      extract.on('error', reject);
    });
  };

  return extract;
}
