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

const reader = Object.assign(new Reader(), {
  id: '0dad66d5-670f-41e1-886a-b2e25b510b2d',
  json: { name: 'J. Random Reader', userId: 'auth0|foo1545149868967' },
  userId: 'auth0|foo1545149868967',
  published: '2018-12-18T16:17:49.077Z',
  updated: '2018-12-18 16:17:49'
})
const app = express()

const test = async () => {
  const ReaderStub = {}
  const checkReaderStub = sinon.stub()

  const inboxRoute = proxyquire('../../routes/inbox', {
    '../models/Reader.js': ReaderStub,
    './utils.js': {
      checkReader: checkReaderStub
    }
  })

  inboxRoute(app)
  const request = supertest(app)

  await tap.test('Get Inbox', async () => {
    ReaderStub.Reader.byShortId = async () => Promise.resolve(reader)
    checkReaderStub.returns(true)

    const res = await request
      .get('/reader-123/inbox')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.type(body['@context'], 'string')
    await tap.type(body.type, 'string')
  })

  await tap.test('Get inbox for user that does not exist', async () => {
    ReaderStub.Reader.byShortId = async () => Promise.resolve(null)

    const res = await request
      .get('/reader-123/inbox')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 404)
  })

  await tap.test('Get Inbox that belongs to another reader', async () => {
    ReaderStub.Reader.byShortId = async () => Promise.resolve(reader)
    checkReaderStub.returns(false)

    const res = await request
      .get('/reader-123/inbox')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 403)
  })
}

test()
