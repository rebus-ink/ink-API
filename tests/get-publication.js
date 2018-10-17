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
    .get('/foo/publication/1')
    .set('Host', 'reader-api.test')

  await tap.equal(res.statusCode, 200)

  await tap.equal(
    res.get('Content-Type'),
    'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
  )

  const body = res.body

  await tap.type(body, 'object')

  await tap.ok(Array.isArray(body['@context']))
  await tap.equal(body['@context'].length, 2)
  await tap.equal(body['@context'][0], 'https://www.w3.org/ns/activitystreams')
  await tap.type(body['@context'][1], 'object')
  await tap.equal(
    body['@context'][1].reader,
    'https://rebus.foundation/ns/reader'
  )

  await tap.equal(body.id, 'https://reader-api.test/foo/publication/1')
  await tap.equal(body.type, 'reader:Publication')
  await tap.ok(body.name)
  await tap.ok(body.attributedTo)
  await tap.ok(Array.isArray(body.orderedItems))
  await tap.ok(body.orderedItems.length > 0)

  for (let i = 0; i < body.orderedItems.length; i++) {
    let item = body.orderedItems[i]
    await tap.type(item, 'object')
    await tap.match(
      item.id,
      /^https:\/\/reader-api.test\/foo\/publication\/1\/document/
    )
    await tap.equal(item.type, 'Document')
    await tap.ok(item.name)
  }
}

main()
