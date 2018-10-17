// test route to POST a user outbox

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

  await tap.match(
    res.get('Location'),
    /https:\/\/reader-api.test\/foo\/activity\/(.*)$/
  )
  await tap.equal(res.statusCode, 201)
}

main()
