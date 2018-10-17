// test route to POST a user outbox

const tap = require('tap')
const request = require('supertest')
const { URL } = require('url')

process.env.NODE_ENV = 'development'

const main = async () => {
  let app
  await tap.test('App exists', async () => {
    app = require('../server').app
  })
  await tap.type(app, 'function')

  const res = await request(app)
    .post('/foo/activity')
    .set('Host', 'reader-api.test')
    .type(
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )
    .send(
      JSON.stringify({
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Read',
        object: {
          id: 'https://reader-api.test/foo/publication/1/document/1',
          type: 'Document',
          name: `Publication 1 Chapter 1`
        }
      })
    )

  const activity = res.get('Location')

  await tap.match(activity, /https:\/\/reader-api.test\/foo\/activity\/(.*)$/)
  await tap.equal(res.statusCode, 201)

  const activityURL = new URL(activity)

  const ares = await request(app)
    .get(activityURL.pathname)
    .set('Host', 'reader-api.test')

  await tap.equal(ares.statusCode, 200)

  await tap.equal(
    ares.get('Content-Type'),
    'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
  )

  const body = ares.body

  await tap.type(body, 'object')

  await tap.ok(Array.isArray(body['@context']))
  await tap.equal(body['@context'].length, 2)
  await tap.equal(body['@context'][0], 'https://www.w3.org/ns/activitystreams')
  await tap.type(body['@context'][1], 'object')
  await tap.equal(
    body['@context'][1].reader,
    'https://rebus.foundation/ns/reader'
  )

  await tap.equal(body.id, activity)
  await tap.equal(body.type, 'Read')

  await tap.type(body.object, 'object')
  await tap.type(body.object.id, 'string')
  await tap.equal(
    body.object.id,
    'https://reader-api.test/foo/publication/1/document/1'
  )
  await tap.type(body.object.type, 'Document')
}

main()
