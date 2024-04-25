import fs from 'fs'
import {parse} from './resolv.peg.js'

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
 * Parse the contents of a file like resolv.conf.
 *
 * @param {string} [filename='/etc/resolv.conf'] The filename to read
 *   and parse.
 * @returns {Promise<ResolvResults>} The parsed contents of the file.
 */
export async function parseFile(filename = '/etc/resolv.conf') {
  const contents = await fs.promises.readFile(filename, 'utf8')
  return parse(contents)
}

export {
  parse,
}
