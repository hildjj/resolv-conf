// See https://man7.org/linux/man-pages/man5/resolv.conf.5.html

{{
// @ts-nocheck
import net from 'net'
import {resolv, gather, maybeNum} from './defaults.js'
}}

lines = lines:lineComment|.., eol| eol? {
  return resolv(gather(lines));
}

lineComment = s @line? s comment?

line
  = nameserver
  / search
  / domain
  / options
  / sortlist
  / unknown

comment = [;#] [^\r\n]* { return undefined; }
nameserver = "nameserver" S nameserver:ip { return { nameserver } }
search
  = "search" S search:searchDomain|1.., S| {
    return { search };
  }

// The domain directive is an obsolete name for the search directive that
// handles one search list entry only.
domain
  = "domain" S search:searchDomain { return { search } }

options
  = "options" options:(S @option)+ { return { options } }

option
  = n:name v:(s ":" s @name)? { return [n.replace('-', '_'), maybeNum(v)] }

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
name = $[A-Z0-9_-]i+
searchDomain = $[^ :#;,\t\r\n]+
s = [ \t]*
S = [ \t]+
eol
  = "\r\n"
  / "\n"
  / "\r"
