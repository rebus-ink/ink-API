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
    .get('/foo/library')
    .set('Host', 'reader-api.test')

  await tap.equal(res.statusCode, 200)

  await tap.equal(
    res.get('Content-Type'),
    'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
  )

  const body = res.body

  await tap.type(body, 'object')

  await tap.ok(body['@context'])
  await tap.equal(body.id, 'https://reader-api.test/foo/library')
  await tap.equal(body.type, 'Collection')
  await tap.ok(Array.isArray(body.items))
  await tap.ok(body.items.length > 0)

  for (let i = 0; i < body.items.length; i++) {
    let item = body.items[i]
    await tap.type(item, 'object')
    await tap.match(item.id, /^https:\/\/reader-api.test\/foo\/publication/)
    await tap.equal(item.type, 'reader:Publication')
    await tap.ok(item.name)
    await tap.ok(item.attributedTo)
  }
}

main()
