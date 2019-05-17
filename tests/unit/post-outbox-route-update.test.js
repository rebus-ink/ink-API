const proxyquire = require('proxyquire')
const sinon = require('sinon')
const supertest = require('supertest')
const express = require('express')
const tap = require('tap')
const passport = require('passport')
const { ExtractJwt } = require('passport-jwt')
const MockStrategy = require('passport-mock-strategy')
const { Reader } = require('../../models/Reader')
const { Note } = require('../../models/Note')
const { Activity } = require('../../models/Activity')
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

const updateNoteRequest = {
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  type: 'Update',
  object: {
    type: 'Note',
    id: 'http://localhost:8080/note-123',
    content: 'Sample Note content'
  }
}

const updatePublicationRequest = {
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  type: 'Update',
  object: {
    type: 'Publication',
    id: 'http://localhost:8080/publication-123',
    name: 'New name for pub A',
    description: 'New description for Publication',
    json: { property: 'New value for json property' },
    inLanguage: ['Swahili', 'French'],
    keywords: ['newKeyWord1', 'newKeyWord2'],
    author: [
      { type: 'Person', name: 'New Sample Author' },
      { type: 'Organization', name: 'New Org inc.' }
    ],
    editor: [{ type: 'Person', name: 'New Sample Editor' }]
  }
}

const reader = Object.assign(new Reader(), {
  id: '7441db0a-c14b-4925-a7dc-4b7ff5d0c8cc',
  json: { name: 'J. Random Reader', readerId: 'auth0|foo1545228877880' },
  readerId: 'auth0|foo1545228877880',
  published: '2018-12-19T14:14:37.965Z',
  updated: '2018-12-19 14:14:37'
})

const note = Object.assign(new Note(), {
  id: '7441db0a-c14b-4925-a7dc-4b7ff5d0c8cc',
  json: { content: 'some text', type: 'Note' },
  readerId: 'auth0|foo1545228877880',
  published: '2018-12-19T14:14:37.965Z',
  updated: '2018-12-19 14:14:37'
})

const publication = Object.assign(new Publication(), {
  id: '7441db0a-c14b-4925-a7dc-4b7ff5d0c8cc',
  type: 'Publication',
  name: 'Publication A',
  readingOrder: [
    {
      '@context': 'https://www.w3.org/ns/activitystreams',
      href: 'http://example.org/abc',
      hreflang: 'en',
      mediaType: 'text/html',
      name: 'An example reading order object2'
    },
    {
      '@context': 'https://www.w3.org/ns/activitystreams',
      href: 'http://example.org/abc',
      hreflang: 'en',
      mediaType: 'text/html',
      name: 'An example reading order object'
    },
    {
      '@context': 'https://www.w3.org/ns/activitystreams',
      href: 'http://example.org/abc',
      hreflang: 'en',
      mediaType: 'text/html',
      name: 'An example reading order object3'
    }
  ]
})

const activity = Object.assign(new Activity(), {
  id: 'dc9794fa-4806-4b56-90b9-6fd444fc1485',
  type: 'Arrive',
  object: { property: 'something ' },
  readerId: 'b10debec-bfee-438f-a394-25e75457ff62',
  published: '2018-12-18T14:56:53.173Z',
  updated: '2018-12-18 14:56:53',
  reader: {
    id: 'b10debec-bfee-438f-a394-25e75457ff62',
    json: { name: 'J. Random Reader', readerId: 'auth0|foo1545145012840' },
    readerId: 'auth0|foo1545145012840',
    published: '2018-12-18T14:56:52.924Z',
    updated: '2018-12-18 14:56:52'
  }
})

const test = async () => {
  const ReaderStub = {}
  const ActivityStub = {}
  const Publication_TagsStub = {}
  const TagStub = {}
  const PublicationStub = {}
  const NoteStub = {}
  const checkReaderStub = sinon.stub()

  const outboxRoute = proxyquire('../../routes/outbox-post', {
    '../models/Reader.js': ReaderStub,
    '../models/Activity.js': ActivityStub,
    '../models/Publications_Tags.js': Publication_TagsStub,
    '../models/Tag.js': TagStub,
    '../models/Publication.js': PublicationStub,
    '../models/Note.js': NoteStub,
    './utils.js': {
      checkReader: checkReaderStub
    }
  })

  outboxRoute(app)
  const request = supertest(app)

  await tap.test('Update a note', async () => {
    ActivityStub.Activity.createActivity = async () => Promise.resolve(activity)
    NoteStub.Note.update = async () => Promise.resolve(note)
    ReaderStub.Reader.byId = async () => Promise.resolve(reader)
    checkReaderStub.returns(true)

    const updateSpy = sinon.spy(NoteStub.Note, 'update')
    const createActivitySpy = sinon.spy(ActivityStub.Activity, 'createActivity')

    const res = await request
      .post('/reader-123/activity')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(JSON.stringify(updateNoteRequest))

    await tap.equal(res.statusCode, 201)
    await tap.ok(updateSpy.calledOnce)
    await tap.ok(createActivitySpy.calledOnce)
  })

  await tap.test('Try to update a note that does not exist', async () => {
    NoteStub.Note.update = async () => Promise.resolve(null)
    ReaderStub.Reader.byId = async () => Promise.resolve(reader)
    checkReaderStub.returns(true)

    const updateSpy = sinon.spy(NoteStub.Note, 'update')

    const res = await request
      .post('/reader-123/activity')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(JSON.stringify(updateNoteRequest))

    await tap.equal(res.statusCode, 404)
    await tap.ok(res.error.text.startsWith('no note found with id'))
    await tap.ok(updateSpy.calledOnce)
  })

  await tap.test('Update a Publication', async () => {
    ActivityStub.Activity.createActivity = async () => Promise.resolve(activity)
    PublicationStub.Publication.update = async () =>
      Promise.resolve(publication)
    ReaderStub.Reader.byId = async () => Promise.resolve(reader)
    checkReaderStub.returns(true)

    const updateSpy = sinon.spy(PublicationStub.Publication, 'update')
    const createActivitySpy = sinon.spy(ActivityStub.Activity, 'createActivity')

    const res = await request
      .post('/reader-123/activity')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(JSON.stringify(updatePublicationRequest))

    await tap.equal(res.statusCode, 201)
    await tap.ok(updateSpy.calledOnce)
    await tap.ok(createActivitySpy.calledOnce)
  })
}

test()
