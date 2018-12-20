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

const createPublicationRequest = {
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  type: 'Create',
  object: {
    type: 'reader:Publication',
    name: 'Publication A',
    attributedTo: [
      {
        type: 'Person',
        name: 'Sample Author'
      }
    ],
    totalItems: 2,
    orderedItems: [
      {
        type: 'Document',
        name: 'Chapter 1',
        content: 'Sample document content 1'
      },
      {
        type: 'Document',
        name: 'Chapter 2',
        content: 'Sample document content 2'
      }
    ]
  }
}

const createDocumentRequest = {
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  type: 'Create',
  object: {
    type: 'Document',
    name: 'Chapter 2',
    content: 'Sample document content 2',
    position: 1
  }
}

const neutralActivityRequest = {
  '@context': 'https://www.w3.org/ns/activitystreams',
  type: 'Arrive',
  location: {
    id: 'https://places.test/rebus-foundation-office',
    type: 'Place',
    nameMap: {
      en: 'Rebus Foundation Office'
    }
  }
}

const activity = Object.assign(new Activity(), {
  id: 'dc9794fa-4806-4b56-90b9-6fd444fc1485',
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

const reader = Object.assign(new Reader(), {
  id: '7441db0a-c14b-4925-a7dc-4b7ff5d0c8cc',
  json: { name: 'J. Random Reader', userId: 'auth0|foo1545228877880' },
  userId: 'auth0|foo1545228877880',
  published: '2018-12-19T14:14:37.965Z',
  updated: '2018-12-19 14:14:37'
})

const test = async () => {
  const ReaderStub = {}
  const ActivityStub = {}
  const checkReaderStub = sinon.stub()

  const outboxRoute = proxyquire('../../routes/outbox-post', {
    '../models/Reader.js': ReaderStub,
    '../models/Activity.js': ActivityStub,
    './utils.js': {
      checkReader: checkReaderStub
    }
  })

  outboxRoute(app)
  const request = supertest(app)

  await tap.test('Create Neutral Activity', async () => {
    ActivityStub.Activity.createActivity = async () => Promise.resolve(activity)
    ReaderStub.Reader.byShortId = async () => Promise.resolve(reader)
    checkReaderStub.returns(true)

    const createActivitySpy = sinon.spy(ActivityStub.Activity, 'createActivity')

    const res = await request
      .post('/reader-123/activity')
      .set('Host', 'reader-api.test')
      .send(JSON.stringify(neutralActivityRequest))
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 201)
    await tap.ok(createActivitySpy.calledOnce)
  })

  await tap.test('Create publication', async () => {
    ActivityStub.Activity.createActivity = async () => Promise.resolve(activity)
    ReaderStub.Reader.addPublication = async () => Promise.resolve(reader)
    ReaderStub.Reader.byShortId = async () => Promise.resolve(reader)
    checkReaderStub.returns(true)

    const addPublicationSpy = sinon.spy(ReaderStub.Reader, 'addPublication')
    const createActivitySpy = sinon.spy(ActivityStub.Activity, 'createActivity')

    const res = await request
      .post('/reader-123/activity')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(JSON.stringify(createPublicationRequest))

    await tap.equal(res.statusCode, 201)
    await tap.ok(addPublicationSpy.calledOnce)
    await tap.ok(createActivitySpy.calledOnce)
  })

  await tap.test('Create document', async () => {
    ActivityStub.Activity.createActivity = async () => Promise.resolve(activity)
    ReaderStub.Reader.addDocument = async () => Promise.resolve(reader)
    ReaderStub.Reader.byShortId = async () => Promise.resolve(reader)
    checkReaderStub.returns(true)

    const addDocumentSpy = sinon.spy(ReaderStub.Reader, 'addDocument')
    const createActivitySpy = sinon.spy(ActivityStub.Activity, 'createActivity')

    const res = await request
      .post('/reader-123/activity')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(JSON.stringify(createDocumentRequest))

    await tap.equal(res.statusCode, 201)
    await tap.ok(addDocumentSpy.calledOnce)
    await tap.ok(createActivitySpy.calledOnce)
  })

  await tap.test('Try to create an activity for the wrong user', async () => {
    checkReaderStub.returns(false)
    ReaderStub.Reader.byShortId = async () => Promise.resolve(reader)

    const res = await request
      .post('/reader-123/activity')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(JSON.stringify(neutralActivityRequest))

    await tap.equal(res.statusCode, 403)
  })
}

test()
