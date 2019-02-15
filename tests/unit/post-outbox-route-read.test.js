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
const { Document } = require('../../models/Document')

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

const readActivityRequest = {
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' },
    { oa: 'http://www.w3.org/ns/oa#' }
  ],
  type: 'Read',
  object: {
    type: 'Document',
    id: 'https://localhost:8080/document-123'
  },
  context: 'http://localhost:8080/publication-456'
}

const activity = Object.assign(new Activity(), {
  id: 'dc9794fa-4806-4b56-90b9-6fd444fc1485',
  type: 'Read',
  json: {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      { reader: 'https://rebus.foundation/ns/reader' }
    ],
    type: 'Create',
    object: {
      type: 'Document',
      id: 'https://reader-api.test/document-m1vGaFVCQTzVBkdLFaxbSm'
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

const document = Object.assign(new Document(), {
  id: 'dd8974e5-0641-46df-be73-7581972ebbf2',
  type: 'text/html',
  json: {
    type: 'Document',
    name: 'Chapter 1',
    content: 'Sample document content 1',
    position: 0
  },
  readerId: '9d2f717f-54b2-4732-a045-e0419c94a1c4',
  publicationId: '28ca9d84-9afb-4f9e-a437-6f05dc2f5824',
  published: '2018-12-18T16:11:05.391Z',
  updated: '2018-12-18 16:11:05'
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
  const Publication_TagsStub = {}
  const TagStub = {}
  const PublicationStub = {}
  const checkReaderStub = sinon.stub()
  const DocumentStub = {}

  const outboxRoute = proxyquire('../../routes/outbox-post', {
    '../models/Reader.js': ReaderStub,
    '../models/Activity.js': ActivityStub,
    '../models/Publications_Tags.js': Publication_TagsStub,
    '../models/Tag.js': TagStub,
    '../models/Publication.js': PublicationStub,
    '../models/Document.js': DocumentStub,
    './utils.js': {
      checkReader: checkReaderStub
    }
  })

  outboxRoute(app)
  const request = supertest(app)

  await tap.test('Read activity', async () => {
    ActivityStub.Activity.createActivity = async () => Promise.resolve(activity)
    ReaderStub.Reader.byShortId = async () => Promise.resolve(reader)
    DocumentStub.Document.byShortId = async () => Promise.resolve(document)
    checkReaderStub.returns(true)

    const createActivitySpy = sinon.spy(ActivityStub.Activity, 'createActivity')

    const res = await request
      .post('/reader-123/activity')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(JSON.stringify(readActivityRequest))

    await tap.equal(res.statusCode, 201)
    await tap.ok(createActivitySpy.calledOnce)
  })
}

test()
