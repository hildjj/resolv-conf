'use strict'

const {resolv, maybeNum, gather} = require('../lib/defaults')
const origEnv = {...process.env}

afterEach(() => {
  process.env = origEnv
})

test('maybeNum', () => {
  expect(maybeNum(null)).toEqual(true)
  expect(maybeNum(undefined)).toEqual(true)
  expect(maybeNum('12')).toEqual(12)
  expect(maybeNum('zz')).toEqual('zz')
})

test('gather', () => {
  expect(gather([null])).toEqual({})
  expect(gather([{}])).toEqual({})
  expect(gather([{
    '': true
  }])).toEqual({})
  expect(gather([{
    foo: null
  }])).toEqual({})
})

test('LOCALDOMAIN', () => {
  process.env.LOCALDOMAIN = ''
  expect(resolv({})).toEqual({
    nameserver: [ '127.0.0.1', '::1'],
    options: {
      ndots: 1
    },
    search: []
  })
  process.env.LOCALDOMAIN = 'baz bag'
  expect(resolv({
    search: ['boo']
  })).toEqual({
    nameserver: [ '127.0.0.1', '::1'],
    options: {
      ndots: 1
    },
    search: ['baz.', 'bag.']
  })
})

test('RES_OPTIONS', () => {
  process.env.RES_OPTIONS = 'ndots:3 debug foo:no'
  expect(resolv({})).toEqual(expect.objectContaining({
    options: {
      ndots: 3,
      debug: true,
      foo: 'no'
    }
  }))
})
