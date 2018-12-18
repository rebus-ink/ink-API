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

const document = new Document()

// don't know why that is necessary, but it has an error if I define it with the
// rest of the objet above.
// activity.id = 'dc9794fa-4806-4b56-90b9-6fd444fc1485'

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
