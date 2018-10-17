// test route to GET a user's streams

const tap = require('tap')
const request = require('supertest')

process.env.NODE_ENV = 'development'

const main = async () => {
  let app
  await tap.test('App exists', async () => {
    app = require('../server').app
  })
  await tap.type(app, 'function')

  const res = await request(app)
    .get('/foo/streams')
    .set('Host', 'reader-api.test')

  await tap.equal(res.statusCode, 200)

  await tap.equal(
    res.get('Content-Type'),
    'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
  )

  const body = res.body

  await tap.type(body, 'object')
  await tap.equal(body['@context'], 'https://www.w3.org/ns/activitystreams')
  await tap.equal(body.id, 'https://reader-api.test/foo/streams')
  await tap.equal(body.type, 'Collection')
  await tap.ok(Array.isArray(body.items))
  await tap.ok(body.items.length > 0)

  const [library] = body.items.filter(
    item => item.id === 'https://reader-api.test/foo/library'
  )

  await tap.type(library, 'object')

  await tap.equal(library.id, 'https://reader-api.test/foo/library')
  await tap.equal(library.type, 'Collection')
}

main()
