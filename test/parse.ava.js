import {parse, parseFile} from '../lib/index.js';
import {fileURLToPath} from 'url';
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
  t.throws(() => peggyParse('nameserver ::1 \b'));
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
    'domain',
    'domain :',
    'options',
    'options :',
    'sortlist',
    'sortlist /',
    'search',
    'search ',
  ]) {
    ish(t, parse(e), {errors: [{text: e}]});
  }

  // Various exceptions:
  for (const e of [
    'nameserver ::1 z',
    'nameserver ::1z',
    'search foo bar baz :',
    'options foo::',
    'sortlist 127.0.0.1/127.255.255.255 /',
    'sortlist 127.0.0.1/300',
    'search foo :',
  ]) {
    t.throws(() => peggyParse(e), {message: /^Expected .*but.*found.$/});
  }
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

test('parseFile', async t => {
  const rc = fileURLToPath(new URL('resolv.conf', import.meta.url));
  ish(t, await parseFile(rc), {
    nameserver: ['10.1.1.1'],
  });
  await t.throwsAsync(() => parseFile(' __ NO __ SUCH __ FILE'));
  await t.throwsAsync(() => parseFile(new URL('bad.conf', import.meta.url)));
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
    {
      invalidInput: '\xFFFF',
    },
  ]);
  t.pass();
});
