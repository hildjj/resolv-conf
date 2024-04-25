# Parse resolv.conf

This repo uses the Linux documentation for [resolv.conf(5)](https://man7.org/linux/man-pages/man5/resolv.conf.5.html) to parse the configuration for DNS resolution on your system.  Windows uses a different approach, so the best you can do is likely the Node built-in [`dns.getServers()`](https://nodejs.org/api/dns.html#dns_dns_getservers).

Note that the defaults and environment variables listed in the docs were also implemented.

## Install

```sh
npm install resolv-conf
```

## Usage

```js
const resolv = require('resolv-conf')
await resolv.parseFile()  // filename is optional

// returns:
// {
//   nameserver: [ '127.0.0.1', '::1' ],
//   options: { ndots: 1 },
//   searchlist: [...],
//   sortlist: [ { addr: ..., mask: ...}, ...]
//   errors: [ {text: "...", location:...} ]
// }

// if you already have text from the file:
resolv.parse(text)
```

## Errors

Unrecoverable parse errors will throw an exception with `location`, `expected`, `found`, and `message` properties.

Recoverable errors (e.g. invalid IP addresses) will show up in the result object in the `errors` property, and valid defaults will be chosen for that option if need be.

## Other libraries

I looked at [resolv](https://github.com/fmahnke/resolv), but didn't feel like it was close enough to what I needed, it didn't have tests, etc.  Since the project hadn't been touched in several years, I figured it was easier to start over.  (Sorry, @fmahnke; let me know if that was a bad assumption and I'm happy to collaborate.)

## Status

[![Tests](https://github.com/hildjj/resolv-conf/actions/workflows/node.js.yml/badge.svg)](https://github.com/hildjj/resolv-conf/actions/workflows/node.js.yml)
[![codecov](https://codecov.io/gh/hildjj/resolv-conf/graph/badge.svg?token=Y4Z2ALWXAA)](https://codecov.io/gh/hildjj/resolv-conf)
