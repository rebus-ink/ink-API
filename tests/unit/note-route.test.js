const proxyquire = require('proxyquire')
const sinon = require('sinon')
const supertest = require('supertest')
const express = require('express')
const tap = require('tap')
const passport = require('passport')
const { ExtractJwt } = require('passport-jwt')
const MockStrategy = require('passport-mock-strategy')
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

const note = Object.assign(new Note(), {
  id: 'd66ffff8-06ad-4d72-88a2-4fddfb123a12',
  type: 'text/html',
  json: {
    type: 'Note',
    content: 'Sample Note content',
    'oa:hasSelector': {},
    context: 'http://localhost:8080/publication-abc123',
    inReplyTo: 'http://localhost:8080/document-abc123'
  },
  readerId: '36dee441-3bf0-4e24-9d36-87bf01b27e89',
  published: '2018-12-18T15:54:12.106Z',
  updated: '2018-12-18 15:54:12'
})

const test = async () => {
  const NoteStub = {}
  const checkReaderStub = sinon.stub()

  const noteRoute = proxyquire('../../routes/note', {
    '../models/Note.js': NoteStub,
    './utils.js': {
      checkReader: checkReaderStub
    }
  })

  noteRoute(app)
  const request = supertest(app)

  await tap.test('Get Note', async () => {
    NoteStub.Note.byShortId = async () => Promise.resolve(note)
    checkReaderStub.returns(true)

    const res = await request
      .get('/note-123')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.type, 'Note')
    await tap.type(body.id, 'string')
    await tap.type(body.inReplyTo, 'string')
    await tap.type(body.context, 'string')
    await tap.type(body['oa:hasSelector'], 'object')
    await tap.type(body['@context'], 'object')
    await tap.ok(Array.isArray(body['@context']))
  })

  await tap.test('Get Note that does not exist', async () => {
    NoteStub.Note.byShortId = async () => Promise.resolve(undefined)

    const res = await request
      .get('/note-123')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 404)
  })

  await tap.test('Get Note that belongs to another reader', async () => {
    NoteStub.Note.byShortId = async () => Promise.resolve(note)
    checkReaderStub.returns(false)

    const res = await request
      .get('/note-123')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 403)
  })
}

test()
