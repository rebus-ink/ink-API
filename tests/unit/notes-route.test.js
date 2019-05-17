const proxyquire = require('proxyquire')
const sinon = require('sinon')
const supertest = require('supertest')
const express = require('express')
const tap = require('tap')
const passport = require('passport')
const { ExtractJwt } = require('passport-jwt')
const MockStrategy = require('passport-mock-strategy')
const { Note } = require('../../models/Note')
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

const note1 = Object.assign(new Note(), {
  id: 'd66ffff8-06ad-4d72-88a2-4fddfb123a12',
  type: 'text/html',
  noteType: 'something',
  content: 'sample note content',
  'oa:hasSelector': { property: 'value' },
  json: { newprop: 'new value' },
  inReplyTo: 'http://server.com/publication-123/path/to/file.html',
  context: 'http://server.com/publication-123',
  readerId: '123',
  published: '2018-12-18T15:54:12.106Z',
  updated: '2018-12-18 15:54:12'
})

const note2 = Object.assign(new Note(), {
  id: 'd66ffff8-06ad-4d72-88a2-4fddfb123a13',
  type: 'text/html',
  noteType: 'something',
  content: 'sample note content for note 2',
  'oa:hasSelector': { property: 'value' },
  json: { newprop: 'new value' },
  inReplyTo: 'http://server.com/publication-123/path/to/file.html',
  context: 'http://server.com/publication-124',
  readerId: '123',
  published: '2018-12-18T15:54:12.106Z',
  updated: '2018-12-18 15:54:12'
})

const readerNotes = Object.assign(new Reader(), {
  id: '95256c7b-e613-4036-899b-d686708b12e0',
  name: 'Joe Smith',
  authId: 'auth0|foo1545149658018',
  published: '2018-12-18T16:14:18.104Z',
  updated: '2018-12-18 16:14:18',
  replies: [note1, note2]
})

const test = async () => {
  const NoteStub = {}
  const ReaderStub = {}
  const checkReaderStub = sinon.stub()

  const noteRoute = proxyquire('../../routes/reader-notes', {
    '../models/Note.js': NoteStub,
    '../models/Reader.js': ReaderStub,
    '../utils/utils.js': {
      checkReader: checkReaderStub
    }
  })

  noteRoute(app)
  const request = supertest(app)

  await tap.test('Get Notes', async () => {
    ReaderStub.Reader.getNotes = async () => Promise.resolve(readerNotes)
    checkReaderStub.returns(true)

    const res = await request
      .get('/reader-123/notes')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.type, 'Collection')
    await tap.type(body.id, 'string')
    await tap.equal(body.items.length, 2)
    await tap.equal(body.items[0].type, 'Note')
  })

  await tap.test('Get Note that does not exist', async () => {
    ReaderStub.Reader.getNotes = async () => Promise.resolve(null)

    const res = await request
      .get('/reader-123/notes')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 404)
  })

  await tap.test('Get Note that belongs to another reader', async () => {
    ReaderStub.Reader.getNotes = async () => Promise.resolve(readerNotes)
    checkReaderStub.returns(false)

    const res = await request
      .get('/reader-123/notes')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 403)
  })
}

test()
