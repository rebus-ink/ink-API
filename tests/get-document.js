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
    .get('/foo/publication/1/document/1')
    .set('Host', 'reader-api.test')

  await tap.equal(
    res.get('Content-Type'),
    'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
  )

  const body = res.body

  await tap.type(body, 'object')

  await tap.ok(body['@context'])
  await tap.equal(
    body.id,
    'https://reader-api.test/foo/publication/1/document/1'
  )
  await tap.equal(body.type, 'Document')
  await tap.ok(body.name)
  await tap.ok(body.content)
}

main()
