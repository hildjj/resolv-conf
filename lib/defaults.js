import os from 'node:os';

/**
 * Address/Mask combinations.
 *
 * @typedef {object} AddrMask The v4/v6 address and netmask.
 * @property {string} address IP address.
 * @property {string} [mask] Netmask for the address.
 */

/**
 * Options parsed from resolv.conf.  Note that option names have dashes ('-')
 * converted to underscores ('_') for easier use in JS.
 *
 * @typedef {object} KnownResolvOptions
 * @prop {boolean} [debug] Sets RES_DEBUG.
 * @prop {number} ndots Sets a threshold for the number of dots which must
 *   appear in a name given to query before an initial absolute query will be
 *   made.  The default for n is 1, meaning that if there are any dots in a
 *   name, the name will be tried first as an absolute name before any search
 *   list elements are appended to it.  The value for this option is silently
 *   capped to 15.
 * @prop {number} [timeout] Sets the amount of time the resolver will wait for
 *   a response from a remote name server before retrying the query via a
 *   different name server. This may not be the total time taken by any
 *   resolver API call and there is no guarantee that a single resolver API
 *   call maps to a single timeout. Measured in seconds, the default is
 *   RES_TIMEOUT (currently 5).  The value for this option is silently capped
 *   to 30.
 * @prop {number} [attempts] Sets the number of times the resolver will send a
 *   query to its name servers before giving up and returning an error to the
 *   calling application.  The default is RES_DFLRETRY (currently 2).  The
 *   value for this option is silently capped to 5.
 * @prop {boolean} [rotate] Sets RES_ROTATE, which causes round-robin
 *   selection of name servers from among those listed.  This has the effect
 *   of spreading the query load among all listed servers, rather than having
 *   all clients try the first listed server first every time.
 * @prop {boolean} [no_aaaa] Sets RES_NOAAAA in _res.options, which suppresses
 *   AAAA queries made by the stub resolver, including AAAA lookups triggered
 *   by NSS-based interfaces such as getaddrinfo(3).  Only DNS lookups are
 *   affected: IPv6 data in hosts(5) is still used, getaddrinfo(3) with
 *   AI_PASSIVE will still produce IPv6 addresses, and configured IPv6 name
 *   servers are still used. To produce correct Name Error (NXDOMAIN) results,
 *   AAAA queries are translated to A queries.  This option is intended
 *   preliminary for diagnostic purposes, to rule out that AAAA DNS queries
 *   have adverse impact.  It is incompatible with EDNS0 usage and DNSSEC
 *   validation by applications.
 * @prop {boolean} [no_check_names] Sets RES_NOCHECKNAME, which disables the
 *   modern BIND checking of incoming hostnames and mail names for invalid
 *   characters such as underscore (_), non-ASCII, or control characters.
 * @prop {boolean} [inet6] Sets RES_USE_INET6.  This has the effect of trying
 *   an AAAA query before an A query inside the gethostbyname(3) function, and
 *   of mapping IPv4 responses in IPv6 "tunneled form" if no AAAA records are
 *   found but an A record set exists. Since glibc 2.25, this option is
 *   deprecated; applications should use getaddrinfo(3), rather than
 *   gethostbyname(3).
 * @prop {boolean} [edns0] Sets RES_USE_EDNS0.  This enables support for the
 *   DNS extensions described in RFC 2671.
 * @prop {boolean} [single_request] Sets RES_SNGLKUP.  By default, glibc
 *   performs IPv4 and IPv6 lookups in parallel since glibc 2.9.  Some
 *   appliance DNS servers cannot handle these queries properly and make the
 *   requests time out.  This option disables the behavior and makes glibc
 *   perform the IPv6 and IPv4 requests sequentially (at the cost of some
 *   slowdown of the resolving process).
 * @prop {boolean} [single_request_reopen] Sets RES_SNGLKUPREOP.  The resolver
 *   uses the same socket for the A and AAAA requests. Some hardware
 *   mistakenly sends back only one reply. When that happens the client system
 *   will sit and wait for the second reply.  Turning this option on changes
 *   this behavior so that if two requests from the same port are not handled
 *   correctly it will close the socket and open a new one before sending the
 *   second request.
 * @prop {boolean} [no_tld_query] Sets RES_NOTLDQUERY.  This option causes
 *   res_nsearch() to not attempt to resolve an unqualified name as if it were
 *   a top level domain (TLD).  This option can cause problems if the site has
 *   ``localhost'' as a TLD rather than having localhost on one or more
 *   elements of the search list.  This option has no effect if neither
 *   RES_DEFNAMES or RES_DNSRCH is set.
 * @prop {boolean} [use_vc] Sets RES_USEVC.  This option forces the use of TCP
 *   for DNS resolutions.
 * @prop {boolean} [no_reload] Sets RES_NORELOAD in _res.options.  This option
 *   disables automatic reloading of a changed configuration file.
 * @prop {boolean} [trust_ad] Sets RES_TRUSTAD in _res.options.  This option
 *   controls the AD bit behavior of the stub resolver. If a validating
 *   resolver sets the AD bit in a response, it indicates that the data in the
 *   response was verified according to the DNSSEC protocol.  In order to rely
 *   on the AD bit, the local system has to trust both the DNSSEC- validating
 *   resolver and the network path to it, which is why an explicit opt-in is
 *   required.  If the trust-ad option is active, the stub resolver sets the
 *   AD bit in outgoing DNS queries (to enable AD bit support), and preserves
 *   the AD bit in responses.  Without this option, the AD bit is not set in
 *   queries, and it is always removed from responses before they are returned
 *   to the application.  This means that applications can trust the AD bit in
 *   responses if the trust-ad option has been set correctly.
 * @prop {boolean} [insecure1] Do not require IP source address on the reply
 *   packet to be equal to the server's address.  BSD only.
 * @prop {boolean} [insecure2] Do not check if the query section of the reply
 *   packet is equal to that of the query packet. For testing purposes only.
 *   BSD only.
 * @prop {boolean} [tcp] Forces the use of TCP for queries. Normal behaviour
 *   is to query via UDP but fall back to TCP on failure.  BSD only.
 */

/**
 * @typedef {KnownResolvOptions & Record<string, any>} ResolvOptions
 */

/**
 * @typedef {object} ResolvError
 * @property {string} text
 * @property {import('peggy').LocationRange} location
 */

/**
 * @typedef {object} GatheredLines
 * @property {Array<string>} [nameserver] The nameserver IP addresses to try,
 *   in order.
 * @property {Record<string, number>} [port] Ports to use when talking to each
 *   nameserver.  The default is in the "" key.  A key will be added for each
 *   nameserver.
 * @property {Array<string>} [search] The domains to search if the target
 *   doesn't have at least options.ndots dots in it.
 * @property {Array<AddrMask>} [sortlist] Sort the results according to these
 *   addresses and netmasks.
 * @property {[name: string, value: any][]} [options] Various options.  Things
 *   that can be converted to numbers will have been, and things that are
 *   flags will have the value true.
 * @property {ResolvError[]} [errors] Errors encountered while parsing the
 *   file, extracted here rather than causing overall parsing to fail.
 * @property {number} [timeout] Specifies the total amount of time allowed for
 *   a name resolution.  This time interval is divided by the number of
 *   nameservers and the number of retries allowed for each nameserver. Only
 *   on MacOS.
 * @property {number} [search_order] Only required for those clients that
 *   share a domain name with other clients.  Queries will be sent to these
 *   clients in order by ascending search_order value.  For example, this
 *   allows two clients for the ".local" domain, which is used by Apple's
 *   multicast DNS, but which may also be used at some sites as private DNS
 *   domain name.  Only on MacOS.
 * @property {("inet4"|"inet6")[]} [family] Specify which type of Internet
 *   protocol family to prefer, if a host is reachable using different address
 *   families. By default IPv4 addresses are queried first, and then IPv6
 *   addresses.  Only on BSD.
 * @property {("file"|"yp"|"bind")[]} [lookup] This keyword is used by the
 *   library routines gethostbyname(3) and gethostbyaddr(3). It specifies
 *   which databases should be searched, and the order to do so.  Only on BSD.
 */

/**
 * The results from parsing a resolv.conf file.
 *
 * @typedef {object} ResolvResults
 * @property {Array<string>} nameserver The nameserver IP addresses to try, in
 *   order.
 * @property {Record<string, number>} port Ports to use when talking to each
 *   nameserver.  The default is in the "" key.  A key will be added for each
 *   nameserver.
 * @property {Array<string>} search The domains to search if the target
 *   doesn't have at least options.ndots dots in it.
 * @property {Array<AddrMask>} [sortlist] Sort the results according to these
 *   addresses and netmasks.
 * @property {number} [timeout] Specifies the total amount of time allowed for
 *   a name resolution.  This time interval is divided by the number of
 *   nameservers and the number of retries allowed for each nameserver. Only
 *   on MacOS.
 * @property {number} [search_order] Only required for those clients that
 *   share a domain name with other clients.  Queries will be sent to these
 *   clients in order by ascending search_order value.  For example, this
 *   allows two clients for the ".local" domain, which is used by Apple's
 *   multicast DNS, but which may also be used at some sites as private DNS
 *   domain name.  Only on MacOS.
 * @property {("file"|"yp"|"bind")[]} [lookup] This keyword is used by the
 *   library routines gethostbyname(3) and gethostbyaddr(3). It specifies
 *   which databases should be searched, and the order to do so.  Only on BSD.
 * @property {("inet4"|"inet6")[]} [family] Specify which type of Internet
 *   protocol family to prefer, if a host is reachable using different address
 *   families. By default IPv4 addresses are queried first, and then IPv6
 *   addresses.  Only on BSD.
 * @property {ResolvOptions} options Various options.  Things that can be
 *   converted to numbers will have been, and things that are flags will have
 *   the value true.
 * @property {ResolvError[]} [errors] Errors encountered while parsing the
 *   file, extracted here rather than causing overall parsing to fail.
 */

const flatOptions = ['timeout', 'search_order'];
const copyProps = [
  'family', 'lookup', 'sortlist', 'search_order', 'timeout', 'errors',
];

/**
 * Add default parameters to a parsed resolv.conf file.
 *
 * @param {GatheredLines} parsed Just what was in the file.
 * @param {Record<string, number>} port The ports detected in the file.
 * @returns {ResolvResults} With the defaults and environment variables filled
 *   in.
 */
export function resolv(parsed, port) {
  // The options keyword of a system's resolv.conf file can be amended on a
  // per-process basis by setting the environment variable RES_OPTIONS to a
  // space-separated list of resolver options...
  /**
   * @type {[string, string | boolean | number][]}
   */
  let envOpts = [];
  if (process.env.RES_OPTIONS != null) {
    const opts = process.env.RES_OPTIONS.split(/\s+/g).filter(x => x);
    envOpts = opts.map(o => {
      /** @type {boolean|number|string} */
      let res = true;
      const p = o.split(':');
      if (p.length > 1) {
        const pv = parseInt(p[1], 10);
        res = Number.isNaN(pv) ? p[1] : pv;
      }
      return [p[0], res];
    });
  }

  /** @type {ResolvResults} */
  const res = {
    nameserver: parsed.nameserver ?? ['127.0.0.1', '::1'],
    port: port ?? {'': 53},
    search: parsed.search ?? [],
    options: {
      ndots: 1,
      ...Object.fromEntries(parsed.options ?? []),
      ...Object.fromEntries(envOpts),
    },
  };

  for (const top of copyProps) {
    if (Object.prototype.hasOwnProperty.call(parsed, top)) {
      // @ts-expect-error Not sure how to type this.
      res[top] = parsed[top];
    }
  }

  for (const ns of res.nameserver) {
    res.port[ns] ??= res.port[''];
  }
  for (const [k, v] of Object.entries(res.port)) {
    if (v === null) {
      delete res.port[k];
    }
  }

  // The search keyword of a system's resolv.conf file can be overridden on a
  // per-process basis by setting the environment variable LOCALDOMAIN to a
  // space-separated list of search domains
  if (process.env.LOCALDOMAIN != null) {
    res.search = process.env.LOCALDOMAIN.split(/\s+/g).filter(x => x);
  } else if (res.search.length === 0) {
    // By default, the search list contains one entry, the local domain name.
    // It is determined from the local hostname returned by gethostname(2);
    // the local domain name is taken to be everything after the first '.'.
    // Finally, if the hostname does not contain a '.', the root domain is
    // assumed as the local domain name.
    const bobs = os.hostname().split('.');
    bobs.shift();
    res.search = [bobs.filter(x => x).join('.')];
  }
  // Ensure all search domains end in '.'; they are all absolute.
  res.search = res.search.map(x => (x.endsWith('.') ? x : `${x}.`));

  return res;
}

/**
 * Convert a string to a number, if possible.
 *
 * @param {string | null} val
 * @returns {boolean | string | number}
 */
export function maybeNum(val) {
  if (val == null) {
    return true;
  }
  const pv = parseInt(val, 10);
  return Number.isNaN(pv) ? val : pv;
}

/**
 *
 * @param {object[]} list
 * @returns {GatheredLines}
 */
export function gather(list) {
  /** @type {Record<string, any>} */
  const res = {};
  for (const line of list) {
    if (!line) {
      continue;
    }
    for (const [k, v] of Object.entries(line)) {
      if (!k || (v == null)) {
        continue;
      }
      const c = res[k];
      if (c) {
        // If there are multiple search directives, only the search list from
        // the last instance is used.  'domain' has already been turned into
        // 'search'.
        if (k === 'search') {
          res.search = [v].flat();
        } if (flatOptions.includes(k)) {
          res[k] = v;
        } else if (Array.isArray(v)) {
          res[k].push(...v);
        } else {
          res[k].push(v);
        }
      } else if (flatOptions.includes(k)) {
        res[k] = v;
      } else {
        res[k] = [v].flat();
      }
    }
  }
  return res;
}
