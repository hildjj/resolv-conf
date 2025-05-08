import {SyntaxError, parse as peggyParse} from './resolv.peg.js';
import fs from 'node:fs';

/**
 * @typedef {import('./defaults.js').ResolvResults} ResolvResults
 */

/**
 * Parse the given text as a resolv.conf file.
 *
 * @param {string} text
 * @param {string} [fileName]
 * @returns {ResolvResults}
 */
export function parse(text, fileName = '/etc/resolv.conf') {
  try {
    return peggyParse(text, {
      grammaSource: fileName,
    });
  } catch (er) {
    if (er instanceof SyntaxError) {
      er.message = er.format([{
        source: fileName,
        text,
      }]);
    }
    throw er;
  }
}

/**
 * Parse the contents of a file like resolv.conf.
 *
 * @param {string} [fileName='/etc/resolv.conf'] The filename to read
 *   and parse.
 * @returns {Promise<ResolvResults>} The parsed contents of the file.
 */
export async function parseFile(fileName = '/etc/resolv.conf') {
  const text = await fs.promises.readFile(fileName, 'utf8');
  return parse(text, fileName);
}
