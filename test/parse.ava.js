import {parse, parseFile} from '../lib/index.js';
import {fileURLToPath} from 'node:url';
import {ish} from './utils.js';
import {parse as peggyParse} from '../lib/resolv.peg.js';
import test from 'ava';
import {testPeggy} from '@peggyjs/coverage';

const DEFAULTS = {
  nameserver: ['127.0.0.1', '::1'],
  search: [/\.$/],
  options: {
    ndots: 1,
  },
};

test('parser errors', t => {
  t.throws(() => peggyParse('', {startRule: 'foo'}));
  t.throws(() => peggyParse('', {startRule: 'comment'}));
  t.throws(() => peggyParse(':'));
});

test('empty', t => {
  ish(t, parse(''), DEFAULTS);
  ish(t, parse('', {startRule: 'lines'}), DEFAULTS);
  ish(t, parse(' \t'), DEFAULTS);
  ish(t, parse('\n'), DEFAULTS);
  ish(t, parse('\r'), DEFAULTS);
  ish(t, parse('\r\n'), DEFAULTS);
  ish(t, parse('     \n'), DEFAULTS);
});

test('comments', t => {
  ish(t, parse('#'), DEFAULTS);
  ish(t, parse('# foo'), DEFAULTS);
  ish(t, parse('; foo'), DEFAULTS);

  //   // Comments where the comment char is not in column 1 are not specified
  ish(t, parse('   # foo'), DEFAULTS);
  ish(t, parse('   ; foo'), DEFAULTS);

  // Comments at the end are not specified
  ish(t, parse(`\
options foo # bar
`), {
    nameserver: ['127.0.0.1', '::1'],
    options: {
      ndots: 1,
      foo: true,
    },
  });
});

test('errors', t => {
  const oldSTL = Error.stackTraceLimit;
  Error.stackTraceLimit = Infinity;

  ish(t, parse('\n\n\nfoo bar\n\n\n'), {
    errors: [
      {
        text: 'foo bar',
        location: {
          source: undefined,
          start: {
            column: 1,
            line: 4,
            offset: 3,
          },
          end: {
            column: 8,
            line: 4,
            offset: 10,
          },
        },
      },
    ],
  });

  // Various errors:
  for (const e of [
    'nameserver',
    'nameserverz',
    'nameserver zzz',
    'nameserver 256.1.1.1',
    'nameserver ::1 \b',
    'nameserver ::1 z',
    'nameserver ::1z',
    'nameserver 64:ff9bfffffffffffffffffffff::192.0.2.1.999',
    'nameserver ::1.a',
    'nameserver 127.0.0.1.a',
    'nameserver 10.1.1.1a',
    'domain',
    'domain :',
    'domain example.com :',
    'options',
    'options :',
    'options foo::',
    'port',
    'port a',
    'sortlist',
    'sortlist /',
    'sortlist 127.0.0.1/127.255.255.255 /',
    'sortlist 127.0.0.1/300',
    'search',
    'search ',
    'search foo bar baz :',
    'search foo :',
    'timeout',
    'timeout:',
    'timeout :',
    'timeout 1:',
    'timeout 10:',
    'timeout 100:',
    'search_order',
    'search_order ',
    'search_order :',
    'search_order 1:',
    'search_order 10:',
    'search_order 100:',
    'lookup',
    'lookup ',
    'lookup:',
    'lookup :',
    'lookup file:',
    'lookup file :',
    'lookup file yp:',
    'lookup file yp :',
    'family',
    'family:',
    'family :',
    'family inet4:',
    'family inet4 :',
    'family inet3',
  ]) {
    ish(t, parse(e), {errors: [{text: e}]});
  }

  // Various exceptions:
  for (const e of [
    'port 70000',
  ]) {
    t.throws(() => peggyParse(e));
  }
  Error.stackTraceLimit = oldSTL;
});

test('nameserver', t => {
  ish(t, parse('nameserver ::1'), {nameserver: ['::1']});
  ish(t, parse('nameserver ::1\t'), {nameserver: ['::1']});
  ish(t, parse('nameserver 10.1.1.1'), {nameserver: ['10.1.1.1']});
  ish(t, parse(`\
nameserver fe80::1
nameserver 10.99.1.1`), {nameserver: ['fe80::1', '10.99.1.1']});
});

test('search', t => {
  ish(t, parse('search example.com'), {search: ['example.com.']});
  ish(t, parse('search foo.example.com example.com  '), {
    search: ['foo.example.com.', 'example.com.'],
  });
  // Overwrite
  ish(t, parse(`\
search foo.example.com example.com
search foo.example.`), {search: ['foo.example.']});
  ish(t, parse('domain example.com'), {search: ['example.com.']});
});

test('options', t => {
  ish(t, parse('options debug timeout:10'), {
    options: {
      ndots: 1,
      timeout: 10,
      debug: true,
    },
  });
});

test('sortlist', t => {
  ish(t, parse('sortlist 130.155.160.0/255.255.240.0 130.155.0.0'), {
    sortlist: [{
      address: '130.155.160.0',
      mask: '255.255.240.0',
    }, {
      address: '130.155.0.0',
      mask: null,
    }],
  });
});

test('port', t => {
  ish(t, parse('port 0'), {port: {'': 0}});
  ish(t, parse('port 12'), {port: {'': 12}});
  ish(t, parse('port 123'), {port: {'': 123}});
  ish(t, parse('port 1234'), {port: {'': 1234}});
  ish(t, parse('port 1234a'), {port: {'': 1234}});
});

test('timeout', t => {
  ish(t, parse('timeout 10'), {timeout: 10});
  ish(t, parse('timeout 10\ntimeout 20'), {timeout: 20});
});

test('linux parseFile', async t => {
  const rc = fileURLToPath(new URL('linux.resolv.conf', import.meta.url));
  ish(t, await parseFile(rc), {
    nameserver: ['10.1.1.1'],
  });
  await t.throwsAsync(() => parseFile(' __ NO __ SUCH __ FILE'));
  await t.throwsAsync(() => parseFile(new URL('bad.conf', import.meta.url)));
});

test('MacOS parseFile', async t => {
  const rc = new URL('macos.resolv.conf', import.meta.url);
  ish(t, await parseFile(rc), {
    nameserver: ['10.1.1.1', '::1', '64:ff9b::192.0.2.128'],
    port: {
      '': 53,
      '10.1.1.1': 678,
      '::1': 780,
      '64:ff9b::192.0.2.128': 999,
    },
    timeout: 30,
    search_order: 1,
  });
});

test('BSD parseFile', async t => {
  const rc = new URL('bsd.resolv.conf', import.meta.url);
  ish(t, await parseFile(rc), {
    nameserver: ['127.0.0.1', '::1'],
    port: {
      '': 53,
      '127.0.0.1': 53,
      '::1': 53,
    },
    family: ['inet6', 'inet4'],
    lookup: ['file', 'yp', 'bind'],
    options: {
      debug: true,
      edns0: true,
      inet6: true,
      insecure1: true,
      insecure2: true,
      tcp: true,
    },
  });
});

test('peggyTest', async t => {
  await testPeggy(new URL('../lib/resolv.peg.js', import.meta.url), [
    {
      validInput: '',
      validResult(res) {
        ish(t, res, DEFAULTS);
        return res;
      },
    },
    {invalidInput: '\uFFFF'},
    {invalidInput: 'port 70000'},
    {
      invalidInput: ':',
      options: {
        peg$silentFails: -1,
        peg$startRuleFunction: 'peg$parsecomment',
      },
    },
    {
      validInput: '#',
      validResult: undefined,
      invalid: '',
      peg$maxFailPos: 1,
      options: {
        peg$silentFails: -1,
        peg$startRuleFunction: 'peg$parsecomment',
      },
    },
    {
      validInput: '# ',
      validResult: undefined,
      invalid: '',
      peg$maxFailPos: 2,
      options: {
        peg$silentFails: -1,
        peg$startRuleFunction: 'peg$parsecomment',
      },
    },
    {
      validInput: '',
      validResult: [],
      invalid: '',
      options: {
        peg$silentFails: -1,
        peg$startRuleFunction: 'peg$parses',
      },
    },
    {
      validInput: ' ',
      validResult: [' '],
      invalid: '',
      peg$maxFailPos: 1,
      options: {
        peg$silentFails: -1,
        peg$startRuleFunction: 'peg$parses',
      },
    },
    {
      invalidInput: '',
      options: {
        peg$silentFails: -1,
        peg$startRuleFunction: 'peg$parseS',
      },
    },
    {
      validInput: ' ',
      validResult: [' '],
      peg$maxFailPos: 1,
      options: {
        peg$silentFails: -1,
        peg$startRuleFunction: 'peg$parseS',
      },
    },
    {
      invalidInput: '',
      options: {
        peg$silentFails: -1,
        peg$startRuleFunction: 'peg$parseeol',
      },
    },
  ]);
  t.pass();
});
