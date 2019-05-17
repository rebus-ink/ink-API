const proxyquire = require('proxyquire')
const sinon = require('sinon')
const supertest = require('supertest')
const express = require('express')
const tap = require('tap')
const passport = require('passport')
const { ExtractJwt } = require('passport-jwt')
const MockStrategy = require('passport-mock-strategy')
const { Reader } = require('../../models/Reader')
const { Publication } = require('../../models/Publication')

const setupPassport = () => {
  var opts = {}
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken()
  opts.secretOrKey = process.env.SECRETORKEY
  opts.issuer = process.env.ISSUER
  opts.audience = process.env.AUDIENCE
  opts.name = 'jwt'
  passport.use(new MockStrategy(opts))
}

setupPassport()

const app = express()

const tag = {
  type: 'reader:Stack',
  name: 'mystack'
}

const publication = Object.assign(new Publication(), {
  id: '6bf73ab4-8b20-4abf-b727-1ca2ab115285',
  description: null,
  name: 'pub 1',
  readingOrder: [{ array: 'of objects' }],
  readerId: '95256c7b-e613-4036-899b-d686708b12e0',
  published: '2018-12-18T16:14:18.331Z',
  updated: '2018-12-18 16:14:18'
})

const publication2 = Object.assign(new Publication(), {
  id: '6bf73ab4-8b20-4abf-b727-1ca2ab115285',
  description: null,
  name: 'pub 2',
  readingOrder: [{ array: 'of objects' }],
  tags: [tag],
  readerId: '95256c7b-e613-4036-899b-d686708b12e0',
  published: '2018-12-18T16:14:18.331Z',
  updated: '2018-12-18 16:14:18'
})

const readerLibrary = Object.assign(new Reader(), {
  id: '95256c7b-e613-4036-899b-d686708b12e0',
  json: { name: 'J. Random Reader', readerId: 'auth0|foo1545149658018' },
  readerId: 'auth0|foo1545149658018',
  published: '2018-12-18T16:14:18.104Z',
  updated: '2018-12-18 16:14:18',
  publications: [publication, publication2]
})

const test = async () => {
  const ReaderStub = {}
  const checkReaderStub = sinon.stub()

  const readerLibraryRoute = proxyquire('../../routes/reader-library', {
    '../models/Reader.js': ReaderStub,
    '../utils/utils.js': {
      checkReader: checkReaderStub
    }
  })

  readerLibraryRoute(app)
  const request = supertest(app)

  await tap.test('Get Reader Library', async () => {
    ReaderStub.Reader.getLibrary = async () => Promise.resolve(readerLibrary)
    checkReaderStub.returns(true)

    const res = await request
      .get('/reader-123/library')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    // should @context be an object or a string?
    await tap.type(body['@context'], 'string')
    await tap.equal(body.type, 'Collection')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 2)
    await tap.ok(Array.isArray(body.items))
    // documents should include:
    await tap.equal(body.items[0].type, 'Publication')
    await tap.type(body.items[0].id, 'string')
    await tap.type(body.items[0].name, 'string')
    await tap.equal(body.items[1].type, 'Publication')
  })

  await tap.test('Get Reader Library, filtering by tag', async () => {
    ReaderStub.Reader.getLibrary = async () => Promise.resolve(readerLibrary)
    checkReaderStub.returns(true)

    const res = await request
      .get(`/reader-123/library?stack=${tag.name}`)
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    // should @context be an object or a string?
    await tap.type(body['@context'], 'string')
    await tap.equal(body.type, 'Collection')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 1)
    await tap.ok(Array.isArray(body.items))
    // documents should include:
    await tap.equal(body.items[0].type, 'Publication')
    await tap.type(body.items[0].id, 'string')
    await tap.type(body.items[0].name, 'string')
    await tap.equal(body.items[0].name, 'pub 2')
    await tap.notOk(body.items[1])
  })

  await tap.test(
    'Get Reader Library that belongs to another reader',
    async () => {
      ReaderStub.Reader.getLibrary = async () => Promise.resolve(readerLibrary)
      checkReaderStub.returns(false)

      const res = await request
        .get('/reader-123/library')
        .set('Host', 'reader-api.test')
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )

      await tap.equal(res.statusCode, 403)
    }
  )

  await tap.test(
    'Get Reader Library for a reader that does not exist',
    async () => {
      ReaderStub.Reader.getLibrary = async () => Promise.resolve(null)
      checkReaderStub.returns(true)

      const res = await request
        .get('/reader-123/library')
        .set('Host', 'reader-api.test')
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )

      await tap.equal(res.statusCode, 404)
    }
  )
}

test()
