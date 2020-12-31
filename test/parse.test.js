'use strict'

const {parse, parseFile} = require('../')
const path = require('path')

const DEFAULTS = expect.objectContaining({
  nameserver: [ '127.0.0.1', '::1' ],
  search: expect.arrayContaining([expect.stringContaining('.')]),
  options: {
    ndots: 1
  }
})

test('parser errors', () => {
  expect(() => parse('', {startRule:'foo'})).toThrow()
  expect(() => parse('', {startRule:'comment'})).toThrow()
  expect(() => parse('nameserver ::1 \b')).toThrow()
  expect(() => parse(':')).toThrow()
})

test('empty', () => {
  expect(parse('')).toEqual(DEFAULTS)
  expect(parse('', {startRule: 'lines'})).toEqual(DEFAULTS)
  expect(parse(' \t')).toEqual(DEFAULTS)
  expect(parse('\n')).toEqual(DEFAULTS)
  expect(parse('\r')).toEqual(DEFAULTS)
  expect(parse('\r\n')).toEqual(DEFAULTS)
  expect(parse('     \n')).toEqual(DEFAULTS)
})

test('comments', () => {
  expect(parse('#')).toEqual(DEFAULTS)
  expect(parse('# foo')).toEqual(DEFAULTS)
  expect(parse('; foo')).toEqual(DEFAULTS)

  // comments where the comment char is not in column 1 are not specified
  expect(parse('   # foo')).toEqual(DEFAULTS)
  expect(parse('   ; foo')).toEqual(DEFAULTS)

  // comments at the end are not specified
  expect(parse(`\
options foo # bar
`)).toEqual(expect.objectContaining({
    nameserver: [ '127.0.0.1', '::1' ],
    search: expect.arrayContaining([expect.stringContaining('.')]),
    options: {
      ndots: 1,
      foo: true
    }
  }))
})

test('errors', () => {
  expect(parse('\n\n\nfoo bar\n\n\n')).toEqual(expect.objectContaining({
    errors: expect.arrayContaining([
      expect.objectContaining({
        text: 'foo bar',
        location: expect.objectContaining({
          start: expect.objectContaining({
            line: 4
          })
        })
      })
    ])
  }))

  expect(parse('nameserver')).toEqual(expect.objectContaining({
    errors: [expect.objectContaining({ text: 'nameserver' })]
  }))
  expect(parse('nameserverz')).toEqual(expect.objectContaining({
    errors: [expect.objectContaining({ text: 'nameserverz' })]
  }))
  expect(parse('nameserver zzz')).toEqual(expect.objectContaining({
    errors: [expect.objectContaining({ text: 'nameserver zzz' })]
  }))
  expect(() => parse('nameserver ::1 z')).toThrow()
  expect(() => parse('nameserver ::1z')).toThrow()
  expect(parse('nameserver 256.1.1.1')).toEqual(expect.objectContaining({
    errors: expect.arrayContaining([
      expect.objectContaining({
        text: 'nameserver 256.1.1.1'
      })
    ])
  }))
  expect(() => parse('search foo bar baz :')).toThrow()
  expect(parse('domain :')).toEqual(expect.objectContaining({
    errors: [expect.objectContaining({ text: 'domain :' })]
  }))
  expect(parse('domain')).toEqual(expect.objectContaining({
    errors: [expect.objectContaining({ text: 'domain' })]
  }))
  expect(parse('options')).toEqual(expect.objectContaining({
    errors: [expect.objectContaining({ text: 'options' })]
  }))
  expect(parse('options :')).toEqual(expect.objectContaining({
    errors: [expect.objectContaining({ text: 'options :' })]
  }))
  expect(() => parse('options foo::')).toThrow()
  expect(parse('sortlist')).toEqual(expect.objectContaining({
    errors: [expect.objectContaining({ text: 'sortlist' })]
  }))
  expect(parse('sortlist /')).toEqual(expect.objectContaining({
    errors: [expect.objectContaining({ text: 'sortlist /' })]
  }))
  expect(() => parse('sortlist 127.0.0.1/127.255.255.255 /')).toThrow()
  expect(() => parse('sortlist 127.0.0.1/300')).toThrow()
})

test('nameserver', () => {
  expect(parse('nameserver ::1')).toEqual(expect.objectContaining({
    nameserver: ['::1']
  }))
  expect(parse('nameserver ::1\t')).toEqual(expect.objectContaining({
    nameserver: ['::1']
  }))
  expect(parse('nameserver 10.1.1.1')).toEqual(expect.objectContaining({
    nameserver: ['10.1.1.1']
  }))
  expect(parse(`\
nameserver fe80::1
nameserver 10.99.1.1`)).toEqual(expect.objectContaining({
    nameserver: ['fe80::1', '10.99.1.1']
  }))
  expect(parse('search')).toEqual(expect.objectContaining({
    errors: [expect.objectContaining({ text: 'search' })]
  }))
  expect(parse('search ')).toEqual(expect.objectContaining({
    errors: [expect.objectContaining({ text: 'search ' })]
  }))
  expect(() => parse('search foo :')).toThrow()
})

test('search', () => {
  expect(parse('search example.com')).toEqual(expect.objectContaining({
    search: ['example.com.']
  }))
  expect(parse('search foo.example.com example.com  '))
    .toEqual(expect.objectContaining({
      search: ['foo.example.com.', 'example.com.']
    }))
  // overwrite
  expect(parse(`\
search foo.example.com example.com
search foo.example.`))
    .toEqual(expect.objectContaining({
      search: ['foo.example.']
    }))
  expect(parse('domain example.com')).toEqual(expect.objectContaining({
    search: ['example.com.']
  }))
})

test('options', () => {
  expect(parse('options debug timeout:10')).toEqual(expect.objectContaining({
    options: {
      ndots: 1,
      timeout: 10,
      debug: true
    }
  }))
})

test('sortlist', () => {
  expect(parse('sortlist 130.155.160.0/255.255.240.0 130.155.0.0'))
    .toEqual(expect.objectContaining({
      sortlist: [{
        address: '130.155.160.0',
        mask: '255.255.240.0'
      }, {
        address: '130.155.0.0',
        mask: null
      }]
    }))
})

test('parseFile', async () => {
  expect(await parseFile(path.join(__dirname, 'resolv.conf')))
    .toEqual(expect.objectContaining({
      nameserver: ['10.1.1.1']
    }))
})
