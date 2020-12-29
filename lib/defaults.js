'use strict'

const os = require('os')

function resolvDefaults(parsed) {
  if (!parsed.nameserver) {
    parsed.nameserver = ['127.0.0.1', '::1']
  }

  // The search keyword of a system's resolv.conf file can be overridden on a
  // per-process basis by setting the environment variable LOCALDOMAIN to a
  // space-separated list of search domains
  if (process.env.LOCALDOMAIN != null) {
    parsed.search = process.env.LOCALDOMAIN.split(/\s+/g).filter(x => x)
  } else if (!parsed.search) {
    // By default, the search list contains one entry, the local domain name.
    // It is determined from the local hostname returned by gethostname(2);
    // the local domain name is taken to be everything after the first '.'.
    // Finally, if the hostname does not contain a '.', the root domain is
    // assumed as the local domain name.
    const bobs = os.hostname().split('.')
    bobs.shift()
    parsed.search = [bobs.filter(x => x).join('.') + '.']
  }

  // The options keyword of a system's resolv.conf file can be amended on a
  // per-process basis by setting the environment variable RES_OPTIONS to a
  // space-separated list of resolver options...
  let envOpts = null
  if (process.env.RES_OPTIONS != null) {
    const opts = process.env.RES_OPTIONS.split(/\s+/g).filter(x => x)
    const om = opts.map(o => {
      /** @type {Array<string|number|boolean>} */
      const r = []
      const p = o.split(':')
      r.push(p[0])
      if (p.length > 1) {
        const pv = parseInt(p[1], 10)
        r.push(Number.isNaN(pv) ? p[1] : pv)
      } else {
        r.push(true)
      }
      return r
    })
    envOpts = Object.fromEntries(om)
  }
  parsed.options = Object.assign({
    ndots: 1
  }, Object.fromEntries(parsed.options ?? []),
  envOpts)
  return parsed
}
module.exports = resolvDefaults
