#! /usr/bin/env node

// This is just a little test harness for playing with the parser.
// Unlikely to be useful to anyone, and excluded from the release.

import * as Tracer from 'pegjs-backtrace';
import * as pegjs from 'peggy';
import {Module as Mod} from 'module';
import fs from 'fs';
import path from 'path';

const fn = path.join(__dirname, '..', 'lib', 'resolv.pegjs');
globalThis.require = Mod.createRequire(fn); // Make relative to pegjs source

const src = fs.readFileSync(fn, 'utf8');
const p = pegjs.generate(src, {
  trace: true,
  output: 'source',
});

// See https://github.com/pegjs/pegjs/issues/363
// eslint-disable-next-line no-eval
const {parse} = eval(p);

function getText() {
  return new Promise((resolve, reject) => {
    let txt = process.argv.slice(2).join(' ');
    if (txt) {
      resolve(txt);
      return;
    }
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => (txt += chunk));
    process.stdin.on('error', reject);
    process.stdin.on('end', () => resolve(txt));
  });
}

getText().then(txt => {
  const tracer = new Tracer(txt, {
    showTrace: true,
    showSource: true,
  });
  // eslint-disable-next-line no-console
  console.dir(parse(txt, {
    tracer,
  }), {
    depth: Infinity,
  });
// eslint-disable-next-line no-console
}, console.error);
