const proxyquire = require('proxyquire')
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
app.use(
  express.json({
    type: [
      'application/json',
      'application/activity+json',
      'application/ld+json'
    ],
    limit: '100mb'
  })
)

const requestObject = {
  '@context': 'https://www.w3.org/ns/activitystream',
  name: 'J. Random Reader',
  profile: { property: 'value' },
  preferences: { color: 'pink' },
  json: { property1: 2 }
}

const reader = Object.assign(new Reader(), {
  id: '0dad66d5670f41e1',
  type: 'Person',
  name: 'J. Random Reader',
  profile: { property: 'value' },
  preferences: { color: 'pink' },
  json: { property1: 2 },
  authId: 'auth0|foo1545149868968',
  published: '2018-12-18T16:17:49.077Z',
  updated: '2018-12-18 16:17:49'
})

const test = async () => {
  const ReaderStub = {}

  const readersRoute = proxyquire('../../routes/readers', {
    '../models/Reader.js': ReaderStub
  })

  readersRoute(app)
  const request = supertest(app)

  await tap.test('Create user', async () => {
    ReaderStub.Reader.checkIfExistsByAuthId = async () => Promise.resolve(false)
    ReaderStub.Reader.createReader = async () => Promise.resolve(reader)

    const res = await request
      .post('/readers')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(JSON.stringify(requestObject))

    await tap.equal(res.statusCode, 201)
  })

  await tap.test(
    'Try to create a user with an id that already exists',
    async () => {
      ReaderStub.Reader.checkIfExistsByAuthId = async () =>
        Promise.resolve(true)

      const res = await request
        .post('/readers')
        .set('Host', 'reader-api.test')
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )
        .send(JSON.stringify(requestObject))

      await tap.equal(res.statusCode, 400)
    }
  )
}

test()
