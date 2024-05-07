// See https://man7.org/linux/man-pages/man5/resolv.conf.5.html

{{
// @ts-nocheck
import net from 'net'
import {resolv, gather, maybeNum} from './defaults.js'
}}

{
  const ports = {
    "": 53
  };
}

lines = lines:lineComment|.., eol| eol? {
  return resolv(gather(lines), ports);
}

lineComment = s @line? s comment?

line
  = @nameserver &lineEnd
  / @search_order &lineEnd
  / @search &lineEnd
  / @domain &lineEnd
  / @options &lineEnd
  / @sortlist &lineEnd
  / @port &lineEnd
  / @timeout &lineEnd
  / @lookup &lineEnd
  / @family &lineEnd
  / unknown

comment "comment"
  = [;#] [^\r\n]* { return undefined; }
nameserver = "nameserver" S nameserver:ipWithPort { return { nameserver } }
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

// Only on MacOS
port
  = "port" S port:portNum {
    ports[''] = port;
  }

// Only on MacOS
timeout
  = "timeout" S n:$[0-9]+ {
    return { timeout: parseInt(n, 10) }
  }

// Only on MacOS.  Format not documented adequately, but let's hope they're
// non-negative integers.
search_order
  = "search_order" S n:$[0-9]+ {
    return { search_order: parseInt(n, 10) }
  }

// Only on BSD.
lookup
  = "lookup" S lookup:lookupApproach|1.., S| {
    return { lookup }
  }

lookupApproach
  = "file"
  / "yp"
  / "bind"

// Only on BSD.
family
  = "family" S family:addressFamily|1..2, S| {
    return { family }
  }

addressFamily
  = $("inet" [46])

unknown
  = name:name s val:$[^#;\r\n]* { return {
    errors: {text: text(), location: location()}}
  }

// Generic v4/v6 address without port
ip = @addr:$[0-9a-fA-F:.]+ &{ return net.isIP(addr) }

ipWithPort
  = ipv4withPort
  / ipv6withPort

ipv6withPort
  = v6:ipv6 "::" v4:ipv4withPort &{ return net.isIPv6(`${v6}::${v4}`) } {
      const v6addr = `${v6}::${v4}`
      ports[v6addr] = ports[v4];
      delete ports[v4];
      return v6addr;
    }
  / addr:ipv6wColon port:("." @portNum)? {
      ports[addr] = port;
      return addr;
    }

ipv6wColon = @addr:$[0-9a-f:]i+ &{ return net.isIPv6(addr) }
ipv6 = $ipv6char*
ipv6char
  = [0-9a-f]i
  / ":" !":"
ipv4withPort
  = addr:ipv4 port:("." @portNum)? {
      ports[addr] = port;
      return addr
    }
ipv4 = @bytes:$byte|4, "."|
byte = @n:$[0-9]+ &{ return (parseInt(n, 10) < 256) }
portNum = n:$[0-9]+ {
  const num = parseInt(n, 10)
  if (num > 65535) {
    error('Invalid port number');
  }
  return num;
}

name = $[A-Z0-9_-]i+
searchDomain = $[^ :#;,\t\r\n]+

lineEnd
  =  s comment? (eol / !.)

s "optional whitespace"
  = [ \t]*
S "whitespace"
  = [ \t]+
eol "EOL"
  = "\r\n"
  / "\n"
  / "\r"
