import os from 'os'

/**
 * Add default parameters to a parsed resolv.conf file.
 *
 * @param {object} parsed Just what was in the file.
 * @returns {object} With the defaults and environment variables filled in.
 */
export function resolv(parsed) {
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
    parsed.search = [bobs.filter(x => x).join('.')]
  }
  parsed.search = parsed.search.map(x => (x.endsWith('.') ? x : `${x}.`))

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
  parsed.options = {
    ndots: 1,
    ...Object.fromEntries(parsed.options ?? []),
    ...envOpts,
  }
  return parsed
}

export function maybeNum(val) {
  if (val == null) {
    return true
  }
  const pv = parseInt(val, 10)
  return Number.isNaN(pv) ? val : pv
}

export function gather(list) {
  const res = {}
  for (const line of list) {
    if (!line) {
      continue
    }
    for (const [k, v] of Object.entries(line)) {
      if (!k || (v == null)) {
        continue
      }
      const c = res[k]
      if (c) {
        // If there are multiple search directives, only the search list from
        // the last instance is used.
        if (k === 'search') {
          res[k] = [v].flat()
        } else {
          res[k].push(v)
        }
      } else {
        res[k] = [v].flat()
      }
    }
  }
  return res
}
