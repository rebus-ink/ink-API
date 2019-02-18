const proxyquire = require('proxyquire')
const sinon = require('sinon')
const supertest = require('supertest')
const express = require('express')
const tap = require('tap')
const passport = require('passport')
const { ExtractJwt } = require('passport-jwt')
const MockStrategy = require('passport-mock-strategy')
const { Publication } = require('../../models/Publication')
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

const document1 = Object.assign(new Document(), {
  id: '0f8732a9-83da-4f75-ab74-314538d2ee92',
  type: 'text/html',
  json: {
    type: 'Document',
    name: 'Chapter 2',
    content: 'Sample document content 2',
    position: 1
  },
  readerId: '9d2f717f-54b2-4732-a045-e0419c94a1c4',
  publicationId: '28ca9d84-9afb-4f9e-a437-6f05dc2f5824',
  published: '2018-12-18T16:11:05.391Z',
  updated: '2018-12-18 16:11:05'
})

const document2 = Object.assign(new Document(), {
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

const document3 = Object.assign(new Document(), {
  id: 'dd8974e5-0641-46df-be73-7581972ebbf2',
  type: 'text/html',
  json: {
    type: 'Document',
    name: 'Not a Chapter',
    content: 'Not a chapter: does not have a position'
  },
  readerId: '9d2f717f-54b2-4732-a045-e0419c94a1c4',
  publicationId: '28ca9d84-9afb-4f9e-a437-6f05dc2f5824',
  published: '2018-12-18T16:11:05.391Z',
  updated: '2018-12-18 16:11:05'
})

const publication = new Publication()
Object.assign(publication, {
  id: '28ca9d84-9afb-4f9e-a437-6f05dc2f5824',
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
  readerId: '9d2f717f-54b2-4732-a045-e0419c94a1c4',
  published: '2018-12-18T16:11:05.379Z',
  updated: '2018-12-18 16:11:05',
  reader: {
    id: '9d2f717f-54b2-4732-a045-e0419c94a1c4',
    json: { name: 'J. Random Reader', userId: 'auth0|foo1545149465058' },
    userId: 'auth0|foo1545149465058',
    published: '2018-12-18T16:11:05.153Z',
    updated: '2018-12-18 16:11:05'
  },
  attachment: [document1, document2, document3]
})

const test = async () => {
  const PublicationStub = {}
  const checkReaderStub = sinon.stub()

  const publicationRoute = proxyquire('../../routes/publication', {
    '../models/Publication.js': PublicationStub,
    './utils.js': {
      checkReader: checkReaderStub
    }
  })

  publicationRoute(app)
  const request = supertest(app)

  await tap.test('Get Publication', async () => {
    PublicationStub.Publication.byShortId = async () =>
      Promise.resolve(publication)
    checkReaderStub.returns(true)

    const res = await request
      .get('/publication-123')
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
    await tap.ok(Array.isArray(body.attachment))
    await tap.ok(Array.isArray(body.orderedItems))
    // check the order of items
    await tap.equal(body.attachment[0].name, 'Chapter 2')
    await tap.equal(body.attachment[2].name, 'Not a Chapter')
    await tap.equal(body.orderedItems[0].name, 'Chapter 1')
    await tap.notOk(body.orderedItems[2])
  })

  await tap.test('Get Publication that does not exist', async () => {
    // does Publication return undefined or null?
    PublicationStub.Publication.byShortId = async () =>
      Promise.resolve(undefined)

    const res = await request
      .get('/publication-123')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 404)
  })

  await tap.test('Get Publication that belongs to another reader', async () => {
    PublicationStub.Publication.byShortId = async () =>
      Promise.resolve(publication)
    checkReaderStub.returns(false)

    const res = await request
      .get('/publication-123')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 403)
  })
}

test()
