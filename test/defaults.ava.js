import {gather, maybeNum, resolv} from '../lib/defaults.js';
import test from 'ava';

const origEnv = {...process.env};

test.afterEach.always(() => {
  process.env = origEnv;
});

test('maybeNum', t => {
  t.true(maybeNum(null));
  t.true(maybeNum(undefined));
  t.is(maybeNum('12'), 12);
  t.is(maybeNum('zz'), 'zz');
});

test('gather', t => {
  t.deepEqual(gather([null]), {});
  t.deepEqual(gather([{}]), {});
  t.deepEqual(gather([{
    '': true,
  }]), {});
  t.deepEqual(gather([{
    foo: null,
  }]), {});
});

test('LOCALDOMAIN', t => {
  process.env.LOCALDOMAIN = '';
  t.deepEqual(resolv({}), {
    nameserver: ['127.0.0.1', '::1'],
    options: {
      ndots: 1,
    },
    port: {
      '': 53,
      '127.0.0.1': 53,
      '::1': 53,
    },
    search: [],
  });
  process.env.LOCALDOMAIN = 'baz bag';
  t.deepEqual(resolv({
    search: ['boo'],
  }), {
    nameserver: ['127.0.0.1', '::1'],
    options: {
      ndots: 1,
    },
    port: {
      '': 53,
      '127.0.0.1': 53,
      '::1': 53,
    },
    search: ['baz.', 'bag.'],
  });
});

test('RES_OPTIONS', t => {
  process.env.RES_OPTIONS = 'ndots:3 debug foo:no';
  t.like(resolv({}), {
    options: {
      ndots: 3,
      debug: true,
      foo: 'no',
    },
  });
});
