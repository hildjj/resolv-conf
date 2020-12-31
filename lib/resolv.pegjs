// See https://man7.org/linux/man-pages/man5/resolv.conf.5.html

{
const net = require('net')
const {resolv, gather, sep, maybeNum} = require('./defaults')
}

lines = first:lineComment? rest:(eol l:lineComment { return l })* {
  return resolv(gather(sep(first, rest)))
}

lineComment = s line:line? s comment? { return line }

line
  = nameserver
  / search
  / domain
  / options
  / sortlist
  / unknown

comment = [;#] [^\r\n]* { return undefined }
nameserver = "nameserver" S nameserver:ip{ return { nameserver } }
search
  = "search" S first:searchDomain rest:(S n:searchDomain { return n })* {
    return { search: sep(first, rest) }
  }

// The domain directive is an obsolete name for the search directive that
// handles one search list entry only.
domain
  = "domain" S first:searchDomain { return { search: first } }

options
  = "options" options:(S opt:option { return opt })+ { return { options } }

option
  = n:name v:(s ":" s v:name { return v })? { return [n, maybeNum(v)] }

sortlist
  = "sortlist" sortlist:(S ipn:ipNetmask { return ipn })+ {
    return { sortlist }
  }

ipNetmask
  = address:ip mask:(s "/" s mask:ip {
    return mask })? { return { address, mask }
  }

unknown
  = name:name s val:$[^#;\r\n]* { return {
    errors: {text: text(), location: location()}}
  }

// There could be lots of ipv[46] parsing, or just use the definition that will
// eventually determine if node can deal with this address.
ip = addr:$[0-9a-fA-F:.]+ &{ return net.isIP(addr) }  { return addr }
name = $[^ :#;.\t\r\n]+
searchDomain = $[^ :#;\t\r\n]+
s = [ \t]*
S = [ \t]+
eol
  = "\r\n"
  / "\n"
  / "\r"
