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

const requestObject = {
  '@context': 'https://www.w3.org/ns/activitystream',
  type: 'Person',
  name: 'J. Random Reader'
}

const reader = Object.assign(new Reader(), {
  id: '0dad66d5-670f-41e1-886a-b2e25b510b2d',
  json: { name: 'J. Random Reader', userId: 'auth0|foo1545149868964' },
  userId: 'auth0|foo1545149868964',
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
    ReaderStub.Reader.checkIfExists = async () => Promise.resolve(false)
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
      ReaderStub.Reader.checkIfExists = async () => Promise.resolve(true)

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
