const proxyquire = require('proxyquire')
const sinon = require('sinon')
const supertest = require('supertest')
const express = require('express')
const tap = require('tap')
const passport = require('passport')
const { ExtractJwt } = require('passport-jwt')
const MockStrategy = require('passport-mock-strategy')
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

const app = express()

const activity = Object.assign(new Activity(), {
  id: 'dc9794fa-4806-4b56-90b9-6fd444fc1485',
  type: 'Arrive',
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  object: {
    type: 'Publication',
    id: 'https://reader-api.test/publication-m1vGaFVCQTzVBkdLFaxbSm'
  },
  actor: {
    type: 'Person',
    id: 'https://reader-api.test/reader-nS5zw1btwDYT5S6DdvL9yj'
  },
  summaryMap: { en: 'someone created' },
  readerId: 'b10debec-bfee-438f-a394-25e75457ff62',
  published: '2018-12-18T14:56:53.173Z',
  reader: {
    id: 'b10debec-bfee-438f-a394-25e75457ff62',
    json: { name: 'J. Random Reader', readerId: 'auth0|foo1545145012840' },
    readerId: 'auth0|foo1545145012840',
    published: '2018-12-18T14:56:52.924Z',
    updated: '2018-12-18 14:56:52'
  }
})

const test = async () => {
  const ActivityStub = {}
  const checkReaderStub = sinon.stub()

  const activityRoute = proxyquire('../../routes/activity', {
    '../models/Activity.js': ActivityStub,
    './utils.js': {
      checkReader: checkReaderStub
    }
  })

  activityRoute(app)
  const request = supertest(app)

  await tap.test('Get Activity', async () => {
    ActivityStub.Activity.byId = async () => Promise.resolve(activity)
    checkReaderStub.returns(true)

    const res = await request
      .get('/activity-123')
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
    await tap.type(body.type, 'string')
  })

  await tap.test('Get Activity that does not exist', async () => {
    // does Activity return undefined or null?
    ActivityStub.Activity.byId = async () => Promise.resolve(null)

    const res = await request
      .get('/activity-123')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 404)
  })

  await tap.test('Get Activity that belongs to another reader', async () => {
    ActivityStub.Activity.byId = async () => Promise.resolve(activity)
    checkReaderStub.returns(false)

    const res = await request
      .get('/activity-123')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 403)
  })
}

test()
