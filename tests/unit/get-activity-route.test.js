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

const activity = new Activity({
  type: 'Activity',
  json: {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      { reader: 'https://rebus.foundation/ns/reader' }
    ],
    type: 'Create',
    object: {
      type: 'reader:Publication',
      id: 'https://reader-api.test/publication-m1vGaFVCQTzVBkdLFaxbSm'
    },
    actor: {
      type: 'Person',
      id: 'https://reader-api.test/reader-nS5zw1btwDYT5S6DdvL9yj'
    },
    summaryMap: { en: 'someone created' }
  },
  readerId: 'b10debec-bfee-438f-a394-25e75457ff62',
  documentId: null,
  publicationId: 'a2091266-624b-4c46-9066-ce1c642b1898',
  noteId: null,
  published: '2018-12-18T14:56:53.173Z',
  updated: '2018-12-18 14:56:53',
  reader: {
    id: 'b10debec-bfee-438f-a394-25e75457ff62',
    json: { name: 'J. Random Reader', userId: 'auth0|foo1545145012840' },
    userId: 'auth0|foo1545145012840',
    published: '2018-12-18T14:56:52.924Z',
    updated: '2018-12-18 14:56:52'
  },
  publication: {
    id: 'a2091266-624b-4c46-9066-ce1c642b1898',
    description: null,
    json: {
      attachment: [
        {
          type: 'Document',
          name: 'Chapter 2',
          content: 'Sample document content 2',
          position: 1
        },
        {
          type: 'Document',
          name: 'Chapter 1',
          content: 'Sample document content 1',
          position: 0
        }
      ],
      type: 'reader:Publication',
      name: 'Publication A',
      attributedTo: [{ type: 'Person', name: 'Sample Author' }]
    },
    readerId: 'b10debec-bfee-438f-a394-25e75457ff62',
    published: '2018-12-18T14:56:53.149Z',
    updated: '2018-12-18 14:56:53'
  },
  document: null,
  note: null
})

// don't know why that is necessary, but it has an error if I define it with the
// rest of the objet above.
activity.id = 'dc9794fa-4806-4b56-90b9-6fd444fc1485'

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
    ActivityStub.Activity.byShortId = async () => Promise.resolve(activity)
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
  })

  await tap.test('Get Activity that does not exist', async () => {
    // does Activity return undefined or null?
    ActivityStub.Activity.byShortId = async () => Promise.resolve(undefined)

    const res = await request
      .get('/activity-123')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 404)
  })

  await tap.test('Get Activity that belongs to another reader', async () => {
    ActivityStub.Activity.byShortId = async () => Promise.resolve(activity)
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
