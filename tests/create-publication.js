// test route to POST a Create Document activity to a user outbox

const tap = require('tap')
const request = require('supertest')
const jwt = require('jsonwebtoken')
const URL = require('url').URL

process.env.NODE_ENV = 'development'

const main = async () => {
  const createpub = {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      { reader: 'https://rebus.foundation/ns/reader' }
    ],
    type: 'Create',
    object: {
      type: 'reader:Publication',
      name: `Publication A`,
      attributedTo: {
        type: 'Person',
        name: 'Sample Author'
      },
      totalItems: 2,
      orderedItems: [
        {
          type: 'Document',
          name: 'Chapter 1',
          content: 'Sample document content 1'
        },
        {
          type: 'Document',
          name: 'Chapter 2',
          content: 'Sample document content 2'
        }
      ]
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
      .send(JSON.stringify(createpub))

    const activity = res.get('Location')

    await tap.match(activity, /https:\/\/reader-api.test\/foo\/activity\/(.*)$/)
    await tap.equal(res.statusCode, 201)

    const activityURL = new URL(activity)

    const ares = await request(app)
      .get(activityURL.pathname)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)

    await tap.equal(ares.statusCode, 200)

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
    await tap.equal(body.type, 'Create')

    await tap.type(body.object, 'object')
    await tap.type(body.object.id, 'string')
    await tap.type(body.object.type, 'reader:Publication')
  })
}

main()
