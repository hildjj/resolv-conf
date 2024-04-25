// See https://man7.org/linux/man-pages/man5/resolv.conf.5.html

{{
import net from 'net'
import {resolv, gather, maybeNum} from './defaults.js'
}}

lines = first:lineComment? rest:(eol @lineComment)* {
  return resolv(gather([first].concat(rest)))
}

lineComment = s @line? s comment?

line
  = nameserver
  / search
  / domain
  / options
  / sortlist
  / unknown

comment = [;#] [^\r\n]* { return undefined }
nameserver = "nameserver" S nameserver:ip { return { nameserver } }
search
  = "search" S first:searchDomain rest:(S @searchDomain)* {
    return { search: [first].concat(rest) }
  }

// The domain directive is an obsolete name for the search directive that
// handles one search list entry only.
domain
  = "domain" S search:searchDomain { return { search } }

options
  = "options" options:(S @option)+ { return { options } }

option
  = n:name v:(s ":" s @name)? { return [n, maybeNum(v)] }

sortlist
  = "sortlist" sortlist:(S @ipNetmask)+ { return { sortlist } }

ipNetmask
  = address:ip mask:(s "/" s @ip)? { return { address, mask } }

unknown
  = name:name s val:$[^#;\r\n]* { return {
    errors: {text: text(), location: location()}}
  }

// There could be lots of ipv[46] parsing, or just use the definition that will
// eventually determine if node can deal with this address.
ip = @addr:$[0-9a-fA-F:.]+ &{ return net.isIP(addr) }
name = $[^ :#;.\t\r\n]+
searchDomain = $[^ :#;\t\r\n]+
s = [ \t]*
S = [ \t]+
eol
  = "\r\n"
  / "\n"
  / "\r"
