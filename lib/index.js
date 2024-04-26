import {SyntaxError, parse as peggyParse} from './resolv.peg.js';
import fs from 'node:fs';

/**
 * Address/Mask combinations.
 *
 * @typedef {object} AddrMask The v4/v6 address and netmask.
 * @property {string} address IP address.
 * @property {string} [mask] Netmask for the address.
 */

/**
 * The results from parsing a resolv.conf file.
 *
 * @typedef {object} ResolvResults
 * @property {Array<string>} nameserver The nameserver IP addresses to try,
 *   in order.
 * @property {Array<string>} search The domains to search if the target
 *   doesn't have at least options.ndots dots in it.
 * @property {Array<AddrMask>} sortlist Sort the results according to these
 *   addresses and netmasks.
 * @property {object} options Various options.  Things that can be converted
 *   to numbers will have been, and things that are flags will have the value
 *   true.
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
      // @ts-expect-error See https://github.com/peggyjs/peggy/issues/477
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
