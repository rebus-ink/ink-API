const proxyquire = require('proxyquire')
const sinon = require('sinon')
const supertest = require('supertest')
const express = require('express')
const tap = require('tap')
const passport = require('passport')
const { ExtractJwt } = require('passport-jwt')
const MockStrategy = require('passport-mock-strategy')
const { Reader } = require('../../models/Reader')

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

const reader = Object.assign(new Reader(), {
  id: '0dad66d5-670f-41e1-886a-b2e25b510b2d',
  name: 'J. Random Reader',
  authId: 'auth0|foo1545149868969',
  published: '2018-12-18T16:17:49.077Z',
  updated: '2018-12-18 16:17:49'
})

const test = async () => {
  const ReaderStub = {}
  const checkReaderStub = sinon.stub()

  const readerRoute = proxyquire('../../routes/reader', {
    '../models/Reader.js': ReaderStub,
    './utils.js': {
      checkReader: checkReaderStub
    }
  })

  readerRoute(app)
  const request = supertest(app)

  await tap.test('Get Reader profile', async () => {
    ReaderStub.Reader.byId = async () => Promise.resolve(reader)
    checkReaderStub.returns(true)

    const res = await request
      .get('/reader-123')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.type(body['@context'], 'object')
    await tap.ok(Array.isArray(body['@context']))
    await tap.equal(body.type, 'Person')
    await tap.type(body.summaryMap, 'object')
    await tap.type(body.inbox, 'string')
    await tap.type(body.outbox, 'string')
  })

  await tap.test('Get Reader profile for another reader', async () => {
    ReaderStub.Reader.byId = async () => Promise.resolve(reader)
    checkReaderStub.returns(false)

    const res = await request
      .get('/reader-123')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 403)
  })

  await tap.test('Get Reader profile that does not exist', async () => {
    ReaderStub.Reader.byId = async () => Promise.resolve(null)
    checkReaderStub.returns(true)

    const res = await request
      .get('/reader-123')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 404)
  })
}

test()
