// See https://man7.org/linux/man-pages/man5/resolv.conf.5.html

{
'use strict'
const net = require('net')
const defaults = require('./defaults')

function maybeNum(val) {
  if (val == null) {
    return true
  }
  const pv = parseInt(val)
  return Number.isNaN(pv) ? val : pv
}
function sep(first, rest) {
  return [first].concat(rest)
}
function gather(list) {
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
      if (!c) {
        res[k] = [v].flat()
      } else {
        // If there are multiple search directives, only the search list from
        // the last instance is used.
        if (k == 'search') {
          res[k] = [v].flat()
        } else {
          res[k].push(v)
        }
      }
    }
  }
  return res
}
}

lines = first:lineComment? rest:(eol l:lineComment { return l })* {
  return defaults(gather(sep(first, rest)))
}

lineComment = s line:line? comment? { return line }

line
  = nameserver
  / search
  / domain
  / options
  / sortlist
  / name:name s val:$[^#;\r\n]* { return {errors: {text: text(), location: location()}} }

comment = s [;#] [^\r\n]* { return undefined }
nameserver = "nameserver" s nameserver:ip s { return { nameserver } }
search = "search" s first:searchDomain rest:(s n:searchDomain { return n })* { return { search: sep(first, rest) } }

// The domain directive is an obsolete name for the search directive that
// handles one search list entry only.
domain = "domain" s first:searchDomain { return { search: first } }
sortlist = "sortlist" s sortlist:ipNetmask+ { return { sortlist } }
options = "options" s options:option+ { return { options } }

option
  = n:name s v:(":" s v:name { return maybeNum(v) })? s { return [n, v ?? true] }

ipNetmask = address:ip mask:(s "/" s mask:ip { return mask })? s { return { address, mask } }

// There could be lots of parsing, or just use the definition that will
// eventually determine if node can deal with this address.
ip = addr:$[0-9a-fA-F:.]+ &{ return net.isIP(addr) }  { return addr }
name = $[^ :#;.\t\r\n]+
searchDomain = $[^ :#;\t\r\n]+
s = [ \t]*
eol
  = "\r\n"
  / "\n"
  / "\r"
