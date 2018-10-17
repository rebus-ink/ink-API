// test route to GET a document

const tap = require('tap')
const request = require('supertest')

// XXX: here to keep the app from bouncing to https

process.env.NODE_ENV = 'development'

const main = async () => {
  let app
  await tap.test('App exists', async () => {
    app = require('../server').app
  })
  await tap.type(app, 'function')

  const res = await request(app)
    .get('/foo/activity/1create')
    .set('Host', 'reader-api.test')

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

main()
