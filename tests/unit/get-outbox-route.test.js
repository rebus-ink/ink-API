const proxyquire = require('proxyquire')
const sinon = require('sinon')
const supertest = require('supertest')
const express = require('express')
const tap = require('tap')
const passport = require('passport')
const { ExtractJwt } = require('passport-jwt')
const MockStrategy = require('passport-mock-strategy')
const { Reader } = require('../../models/Reader')
const { Activity } = require('../../models/Activity')

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

const activity = Object.assign(new Activity(), {
  id: 'b902f2a9-54e0-4fa3-a241-05321fa77c93',
  type: 'Activity',
  json: {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Arrive',
    location: {
      id: 'https://places.test/rebus-foundation-office',
      type: 'Place',
      nameMap: { en: 'Rebus Foundation Office' }
    },
    actor: {
      type: 'Person',
      id: 'https://reader-api.test/reader-fmDoik4sRHpLgwJuQHbGVb'
    },
    summaryMap: { en: 'someone arrived at Rebus Foundation Office' }
  },
  readerId: '7441db0a-c14b-4925-a7dc-4b7ff5d0c8cc',
  documentId: null,
  publicationId: null,
  noteId: null,
  published: '2018-12-19T14:14:38.124Z',
  updated: '2018-12-19 14:14:38'
})

const reader = Object.assign(new Reader(), {
  id: '7441db0a-c14b-4925-a7dc-4b7ff5d0c8cc',
  json: { name: 'J. Random Reader', userId: 'auth0|foo1545228877880' },
  userId: 'auth0|foo1545228877880',
  published: '2018-12-19T14:14:37.965Z',
  updated: '2018-12-19 14:14:37',
  outbox: [activity]
})

const app = express()

const test = async () => {
  const ReaderStub = {}
  const checkReaderStub = sinon.stub()

  const outboxRoute = proxyquire('../../routes/outbox-get', {
    '../models/Reader.js': ReaderStub,
    './utils.js': {
      checkReader: checkReaderStub
    }
  })

  outboxRoute(app)
  const request = supertest(app)

  await tap.test('Get Outbox', async () => {
    ReaderStub.Reader.byShortId = async () => Promise.resolve(reader)
    checkReaderStub.returns(true)

    const res = await request
      .get('/reader-123/activity')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.type(body['@context'], 'string')
    await tap.equal(body.type, 'OrderedCollection')
    await tap.type(body.summaryMap, 'object')
    await tap.ok(Array.isArray(body.orderedItems))
    await tap.type(body.orderedItems[0], 'object')
    await tap.type(body.orderedItems[0].type, 'string')
    await tap.type(body.orderedItems[0].actor, 'object')
    await tap.type(body.orderedItems[0].summaryMap, 'object')
    await tap.type(body.orderedItems[0].id, 'string')
  })

  await tap.test('Get outbox for user that does not exist', async () => {
    ReaderStub.Reader.byShortId = async () => Promise.resolve(null)

    const res = await request
      .get('/reader-123/activity')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 404)
  })

  await tap.test('Get Outbox that belongs to another reader', async () => {
    ReaderStub.Reader.byShortId = async () => Promise.resolve(reader)
    checkReaderStub.returns(false)

    const res = await request
      .get('/reader-123/activity')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 403)
  })
}

test()
