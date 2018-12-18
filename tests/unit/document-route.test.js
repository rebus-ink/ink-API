const proxyquire = require('proxyquire')
const sinon = require('sinon')
const supertest = require('supertest')
const express = require('express')
const tap = require('tap')
const passport = require('passport')
const { ExtractJwt } = require('passport-jwt')
const MockStrategy = require('passport-mock-strategy')
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

const document = Object.assign(new Document(), {
  id: 'd66ffff8-06ad-4d72-88a2-4fddfb123a12',
  type: 'text/html',
  json: {
    type: 'Document',
    name: 'Chapter 1',
    content: 'Sample document content 1',
    position: 0
  },
  readerId: '36dee441-3bf0-4e24-9d36-87bf01b27e89',
  publicationId: '061656bd-f7b3-4cf5-a0d6-1d4ac7c3118d',
  published: '2018-12-18T15:54:12.106Z',
  updated: '2018-12-18 15:54:12',
  reader: {
    id: '36dee441-3bf0-4e24-9d36-87bf01b27e89',
    json: { name: 'J. Random Reader', userId: 'auth0|foo1545148451777' },
    userId: 'auth0|foo1545148451777',
    published: '2018-12-18T15:54:11.865Z',
    updated: '2018-12-18 15:54:11'
  }
})

const test = async () => {
  const DocumentStub = {}
  const checkReaderStub = sinon.stub()

  const documentRoute = proxyquire('../../routes/document', {
    '../models/Document.js': DocumentStub,
    './utils.js': {
      checkReader: checkReaderStub
    }
  })

  documentRoute(app)
  const request = supertest(app)

  await tap.test('Get Document', async () => {
    DocumentStub.Document.byShortId = async () => Promise.resolve(document)
    checkReaderStub.returns(true)

    const res = await request
      .get('/document-123')
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

  await tap.test('Get Document that does not exist', async () => {
    // does Document return undefined or null?
    DocumentStub.Document.byShortId = async () => Promise.resolve(undefined)

    const res = await request
      .get('/document-123')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 404)
  })

  await tap.test('Get Document that belongs to another reader', async () => {
    DocumentStub.Document.byShortId = async () => Promise.resolve(document)
    checkReaderStub.returns(false)

    const res = await request
      .get('/document-123')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 403)
  })
}

test()
