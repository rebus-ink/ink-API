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

const addPubToStackRequest = {
  '@context': [
    'https://www.w3.org/ns/activitystreams',
    { reader: 'https://rebus.foundation/ns/reader' }
  ],
  type: 'Add',
  object: {
    type: 'reader:Stack',
    id: 'https://localhost:8080/tag-123'
  },
  target: {
    type: 'publication',
    id: 'https://localhost:8080/publication-123'
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
    json: { name: 'J. Random Reader', userId: 'auth0|foo1545145012840' },
    userId: 'auth0|foo1545145012840',
    published: '2018-12-18T14:56:52.924Z',
    updated: '2018-12-18 14:56:52'
  }
})

const pub_tag = {
  publicationId: 'abcd',
  tagId: '1234',
  id: '1'
}

const reader = Object.assign(new Reader(), {
  id: '7441db0a-c14b-4925-a7dc-4b7ff5d0c8cc',
  name: 'J. Random Reader',
  authId: 'auth0|foo1545228877880',
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

  const outboxRoute = proxyquire('../../routes/outbox-post', {
    '../models/Reader.js': ReaderStub,
    '../models/Activity.js': ActivityStub,
    '../models/Publications_Tags.js': Publication_TagsStub,
    '../models/Tag.js': TagStub,
    '../models/Publication.js': PublicationStub,
    './utils.js': {
      checkReader: checkReaderStub
    }
  })

  outboxRoute(app)
  const request = supertest(app)

  await tap.test('Add publication to stack', async () => {
    ActivityStub.Activity.createActivity = async () => Promise.resolve(activity)
    Publication_TagsStub.Publication_Tag.addTagToPub = async () =>
      Promise.resolve(pub_tag)
    ReaderStub.Reader.byId = async () => Promise.resolve(reader)
    checkReaderStub.returns(true)

    const addTagToPubSpy = sinon.spy(
      Publication_TagsStub.Publication_Tag,
      'addTagToPub'
    )
    const createActivitySpy = sinon.spy(ActivityStub.Activity, 'createActivity')

    const res = await request
      .post('/reader-123/activity')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(JSON.stringify(addPubToStackRequest))

    await tap.equal(res.statusCode, 201)
    await tap.ok(addTagToPubSpy.calledOnce)
    await tap.ok(createActivitySpy.calledOnce)
  })

  await tap.test('Duplicate Add publication to stack', async () => {
    ActivityStub.Activity.createActivity = async () => Promise.resolve(activity)
    Publication_TagsStub.Publication_Tag.addTagToPub = async () =>
      Promise.resolve(new Error('duplicate'))
    ReaderStub.Reader.byId = async () => Promise.resolve(reader)
    checkReaderStub.returns(true)

    const addTagToPubSpy = sinon.spy(
      Publication_TagsStub.Publication_Tag,
      'addTagToPub'
    )

    const res = await request
      .post('/reader-123/activity')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(JSON.stringify(addPubToStackRequest))

    await tap.equal(res.statusCode, 400)
    await tap.ok(addTagToPubSpy.calledOnce)
  })

  await tap.test('Add publication to stack that does not exist', async () => {
    Publication_TagsStub.Publication_Tag.addTagToPub = async () =>
      Promise.resolve(new Error('no tag'))
    ReaderStub.Reader.byId = async () => Promise.resolve(reader)
    checkReaderStub.returns(true)

    const addTagToPubSpy = sinon.spy(
      Publication_TagsStub.Publication_Tag,
      'addTagToPub'
    )

    const res = await request
      .post('/reader-123/activity')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(JSON.stringify(addPubToStackRequest))
    await tap.equal(res.statusCode, 404)
    await tap.ok(res.error.text.startsWith('no tag found with id'))
    await tap.ok(addTagToPubSpy.calledOnce)
  })

  await tap.test('Add publication that does not exist to a stack', async () => {
    Publication_TagsStub.Publication_Tag.addTagToPub = async () =>
      Promise.resolve(new Error('no publication'))
    ReaderStub.Reader.byId = async () => Promise.resolve(reader)
    checkReaderStub.returns(true)

    const addTagToPubSpy = sinon.spy(
      Publication_TagsStub.Publication_Tag,
      'addTagToPub'
    )

    const res = await request
      .post('/reader-123/activity')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(JSON.stringify(addPubToStackRequest))

    await tap.equal(res.statusCode, 404)
    await tap.ok(res.error.text.startsWith('no publication found with id'))
    await tap.ok(addTagToPubSpy.calledOnce)
  })
}

test()
