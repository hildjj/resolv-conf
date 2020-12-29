'use strict'

const {parse} = require('./resolv.peg')
const util = require('util')
const readFile = util.promisify(require('fs').readFile)

exports.parseFile = async function parseFile(filename='/etc/resolv.conf') {
  const contents = await readFile(filename, 'utf8')
  return parse(contents)
}

exports.parse = parse
