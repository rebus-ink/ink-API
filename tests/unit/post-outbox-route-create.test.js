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
const { Publication } = require('../../models/Publication')
const { Note } = require('../../models/Note')

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
  type: 'Create',
  object: {
    type: 'Publication',
    name: 'Publication A',
    readingOrder: [{ property: 'value' }]
  }
}

const createNoteRequest = {
  type: 'Create',
  object: {
    type: 'Note',
    content: 'Sample Note content',
    'oa:hasSelector': {},
    inReplyTo: 'http://someurl.com/publication-123/path/file.html',
    context: 'http://someurl.com/publication-123'
  }
}

const createStackRequest = {
  type: 'Create',
  object: {
    type: 'reader:Stack',
    name: 'mystack'
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

const tag = {
  id: '1',
  readerId: '1234',
  type: 'reader:Stack',
  name: 'mystack'
}

const reader = Object.assign(new Reader(), {
  id: '7441db0a-c14b-4925-a7dc-4b7ff5d0c8cc',
  name: 'J. Random Reader',
  authId: 'auth0|foo1545228877880',
  published: '2018-12-19T14:14:37.965Z',
  updated: '2018-12-19 14:14:37'
})

const publication = Object.assign(new Publication(), {
  id: '1234',
  name: 'Publication A',
  readingOrder: [{ object: 'with value' }]
})

const note = Object.assign(new Note(), {
  id: '12345',
  noteType: 'something',
  content: 'some content',
  'oa:hasSelector': { object: 'with value' }
})

const test = async () => {
  const ReaderStub = {}
  const ActivityStub = {}
  const Publication_TagsStub = {}
  const TagStub = {}
  const PublicationStub = {}
  const checkReaderStub = sinon.stub()
  const NoteStub = {}

  const outboxRoute = proxyquire('../../routes/outbox-post', {
    '../models/Reader.js': ReaderStub,
    '../models/Activity.js': ActivityStub,
    '../models/Publications_Tags.js': Publication_TagsStub,
    '../models/Tag.js': TagStub,
    '../models/Publication.js': PublicationStub,
    '../models/Note.js': NoteStub,
    '../utils/utils.js': {
      checkReader: checkReaderStub
    }
  })

  outboxRoute(app)
  const request = supertest(app)

  await tap.test('Create Neutral Activity', async () => {
    ActivityStub.Activity.createActivity = async () => Promise.resolve(activity)
    ReaderStub.Reader.byId = async () => Promise.resolve(reader)
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
    PublicationStub.Publication.createPublication = async () =>
      Promise.resolve(publication)
    ReaderStub.Reader.byId = async () => Promise.resolve(reader)
    checkReaderStub.returns(true)

    const addPublicationSpy = sinon.spy(
      PublicationStub.Publication,
      'createPublication'
    )
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

  await tap.test('Create note', async () => {
    ActivityStub.Activity.createActivity = async () => Promise.resolve(activity)
    NoteStub.Note.createNote = async () => Promise.resolve(note)
    ReaderStub.Reader.byId = async () => Promise.resolve(reader)
    checkReaderStub.returns(true)

    const addNoteSpy = sinon.spy(NoteStub.Note, 'createNote')
    const createActivitySpy = sinon.spy(ActivityStub.Activity, 'createActivity')

    const res = await request
      .post('/reader-123/activity')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(JSON.stringify(createNoteRequest))

    await tap.equal(res.statusCode, 201)
    await tap.ok(addNoteSpy.calledOnce)
    await tap.ok(createActivitySpy.calledOnce)
  })

  await tap.test(
    'Try to create a note with no (or invalid) publication context',
    async () => {
      NoteStub.Note.createNote = async () =>
        Promise.resolve(new Error('no publication'))
      ReaderStub.Reader.byId = async () => Promise.resolve(reader)
      checkReaderStub.returns(true)

      const addNoteSpy = sinon.spy(NoteStub.Note, 'createNote')

      const res = await request
        .post('/reader-123/activity')
        .set('Host', 'reader-api.test')
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )
        .send(JSON.stringify(createNoteRequest))

      await tap.equal(res.statusCode, 404)
      await tap.ok(
        res.error.text.startsWith(
          'note creation failed: no publication found with id'
        )
      )
      await tap.ok(addNoteSpy.calledOnce)
    }
  )

  await tap.test(
    'Try to create a note with no (or invalid) document inReplyTo',
    async () => {
      NoteStub.Note.createNote = async () =>
        Promise.resolve(new Error('no document'))
      ReaderStub.Reader.byId = async () => Promise.resolve(reader)
      checkReaderStub.returns(true)

      const addNoteSpy = sinon.spy(NoteStub.Note, 'createNote')

      const res = await request
        .post('/reader-123/activity')
        .set('Host', 'reader-api.test')
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )
        .send(JSON.stringify(createNoteRequest))

      await tap.equal(res.statusCode, 404)
      await tap.ok(
        res.error.text.startsWith('note creation failed: no document found')
      )
      await tap.ok(addNoteSpy.calledOnce)
    }
  )

  await tap.test(
    'Try to create a note where the inReplyTo document does not belong to the context publication',
    async () => {
      NoteStub.Note.createNote = async () =>
        Promise.resolve(new Error('wrong publication'))
      ReaderStub.Reader.byId = async () => Promise.resolve(reader)
      checkReaderStub.returns(true)

      const addNoteSpy = sinon.spy(NoteStub.Note, 'createNote')

      const res = await request
        .post('/reader-123/activity')
        .set('Host', 'reader-api.test')
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )
        .send(JSON.stringify(createNoteRequest))

      await tap.equal(res.statusCode, 400)
      await tap.ok(res.error.text.startsWith('note creation failed: document'))
      await tap.ok(addNoteSpy.calledOnce)
    }
  )

  await tap.test('Create Stack', async () => {
    ActivityStub.Activity.createActivity = async () => Promise.resolve(activity)
    TagStub.Tag.createTag = async () => Promise.resolve(tag)
    ReaderStub.Reader.byId = async () => Promise.resolve(reader)
    checkReaderStub.returns(true)

    const addTagSpy = sinon.spy(TagStub.Tag, 'createTag')
    const createActivitySpy = sinon.spy(ActivityStub.Activity, 'createActivity')

    const res = await request
      .post('/reader-123/activity')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(JSON.stringify(createStackRequest))
    await tap.equal(res.statusCode, 201)
    await tap.ok(addTagSpy.calledOnce)
    await tap.ok(createActivitySpy.calledOnce)
  })

  await tap.test('Try to create an activity for the wrong reader', async () => {
    checkReaderStub.returns(false)
    ReaderStub.Reader.byId = async () => Promise.resolve(reader)

    const res = await request
      .post('/reader-123/activity')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(JSON.stringify(neutralActivityRequest))

    await tap.equal(res.statusCode, 403)
  })

  await tap.test(
    'Try to create an activity for a reader that does not exist',
    async () => {
      checkReaderStub.returns(true)
      ReaderStub.Reader.byId = async () => Promise.resolve(null)

      const res = await request
        .post('/reader-123/activity')
        .set('Host', 'reader-api.test')
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )
        .send(JSON.stringify(neutralActivityRequest))

      await tap.equal(res.statusCode, 404)
    }
  )
}

test()
