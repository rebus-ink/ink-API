// test route to POST a user outbox

const tap = require('tap')
const request = require('supertest')
const jwt = require('jsonwebtoken')

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

  await tap.test('POST /<userid>/activity with no authc', async () => {
    const res = await request(app)
      .post('/foo/activity')
      .set('Host', 'reader-api.test')
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(
        JSON.stringify({
          '@context': 'https://www.w3.org/ns/activitystreams',
          type: 'Create',
          object: {
            type: 'Note',
            content: 'Hello, World!'
          }
        })
      )

    await tap.equal(res.statusCode, 401)
  })

  await tap.test('POST /<userid>/activity with incorrect authc', async () => {
    const options = {
      subject: 'bar',
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
      .send(
        JSON.stringify({
          '@context': 'https://www.w3.org/ns/activitystreams',
          type: 'Create',
          object: {
            type: 'Note',
            content: 'Hello, World!'
          }
        })
      )

    await tap.equal(res.statusCode, 403)
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
      .send(
        JSON.stringify({
          '@context': 'https://www.w3.org/ns/activitystreams',
          type: 'Create',
          object: {
            type: 'Note',
            content: 'Hello, World!'
          }
        })
      )

    await tap.equal(res.statusCode, 201)
    await tap.match(
      res.get('Location'),
      /https:\/\/reader-api.test\/foo\/activity\/(.*)$/
    )
  })
}

main()
