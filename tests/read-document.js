// test route to POST a user outbox

const tap = require('tap')
const request = require('supertest')
const jwt = require('jsonwebtoken')

process.env.NODE_ENV = 'development'

const main = async () => {
  const readdoc = {
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Read',
    object: {
      id: 'https://reader-api.test/foo/publication/1/document/1',
      type: 'Document',
      name: `Publication 1 Chapter 1`
    }
  }

  await tap.test('Environment variables are set', async () => {
    await tap.type(process.env.ISSUER, 'string')
    await tap.type(process.env.SECRETORKEY, 'string')
  })

  let app = null

  await tap.test('App exists', async () => {
    app = require('../server').app
    await tap.type(app, 'function')
  })

  await tap.test('POST /<userid>/activity with correct authc', async () => {
    const options = {
      subject: 'foo',
      expiresIn: '24h',
      issuer: process.env.ISSUER
    }

    const token = jwt.sign({}, process.env.SECRETORKEY, options)

    const res = await request(app)
      .post('/foo/activity')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(JSON.stringify(readdoc))

    const activity = res.get('Location')

    await tap.match(activity, /https:\/\/reader-api.test\/foo\/activity\/(.*)$/)
    await tap.equal(res.statusCode, 201)

    const activityURL = new URL(activity)

    const ares = await request(app)
      .get(activityURL.pathname)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)

    await tap.equal(ares.statusCode, 200)

    await tap.equal(
      ares.get('Content-Type'),
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )

    const body = ares.body

    await tap.type(body, 'object')

    await tap.ok(Array.isArray(body['@context']))
    await tap.equal(body['@context'].length, 2)
    await tap.equal(
      body['@context'][0],
      'https://www.w3.org/ns/activitystreams'
    )
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
  })
}

main()
