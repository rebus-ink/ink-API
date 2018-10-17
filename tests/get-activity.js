// test route to GET a document

const tap = require('tap')
const request = require('supertest')
const jwt = require('jsonwebtoken')

// XXX: here to keep the app from bouncing to https

process.env.NODE_ENV = 'development'

const main = async () => {
  await tap.test('Environment variables are set', async () => {
    await tap.type(process.env.ISSUER, 'string')
    await tap.type(process.env.SECRETORKEY, 'string')
  })

  let app = null
  await tap.test('App exists', async () => {
    app = require('../server').app
    await tap.type(app, 'function')
  })

  await tap.test(
    'GET /<userid>/activity/<actid> with no authentication',
    async () => {
      const res = await request(app)
        .get('/foo/activity/1create')
        .set('Host', 'reader-api.test')

      await tap.equal(res.statusCode, 401)
    }
  )

  await tap.test(
    "GET /<userid>/activity/<actid> with other user's authentication",
    async () => {
      const options = {
        subject: 'bar',
        expiresIn: '24h',
        issuer: process.env.ISSUER
      }

      const token = jwt.sign({}, process.env.SECRETORKEY, options)

      const res = await request(app)
        .get('/foo/activity/1create')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)

      await tap.equal(res.statusCode, 403)
    }
  )

  await tap.test(
    "GET /<userid>/activity/<actid> with user's authentication",
    async () => {
      const options = {
        subject: 'foo',
        expiresIn: '24h',
        issuer: process.env.ISSUER
      }

      const token = jwt.sign({}, process.env.SECRETORKEY, options)

      const res = await request(app)
        .get('/foo/activity/1create')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)

      await tap.equal(res.statusCode, 200)

      await tap.equal(
        res.get('Content-Type'),
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

      const body = res.body

      await tap.type(body, 'object')

      await tap.type(body['@context'], 'object')
      await tap.ok(Array.isArray(body['@context']))

      await tap.equal(body.id, 'https://reader-api.test/foo/activity/1create')
      await tap.equal(body.type, 'Create')
      await tap.type(body.summaryMap, 'object')
      await tap.type(body.summaryMap.en, 'string')
      await tap.type(body.actor, 'object')
      await tap.type(body.actor.id, 'string')
      await tap.type(body.actor.summaryMap, 'object')
      await tap.type(body.actor.summaryMap.en, 'string')
      await tap.type(body.object, 'object')
      await tap.type(body.object.id, 'string')
      await tap.type(body.object.name, 'string')
    }
  )
}

main()
