// test route to GET a user

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
    .get('/foo/inbox')
    .set('Host', 'reader-api.test')

  await tap.equal(res.statusCode, 200)

  await tap.equal(
    res.get('Content-Type'),
    'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
  )

  const body = res.body

  await tap.type(body, 'object')

  await tap.equal(body['@context'], 'https://www.w3.org/ns/activitystreams')
  await tap.equal(body.id, 'https://reader-api.test/foo/inbox')
  await tap.equal(body.type, 'OrderedCollection')
  await tap.ok(Array.isArray(body.orderedItems))
  await tap.equal(body.totalItems, 0)
  await tap.equal(body.orderedItems.length, 0)
}

main()
