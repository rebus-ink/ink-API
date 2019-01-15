const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const { getToken, destroyDB } = require('./utils')
const app = require('../../server').app

const test = async () => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  let readerUrl

  await tap.test('Create User', async () => {
    const res = await request(app)
      .post('/readers')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(
        JSON.stringify({
          '@context': 'https://www.w3.org/ns/activitystreams',
          type: 'Person',
          name: 'Jane Doe'
        })
      )

    await tap.equal(res.status, 201)
    await tap.type(res.get('Location'), 'string')
    readerUrl = res.get('Location')
  })

  await tap.test('Whoami route', async () => {
    const res = await request(app)
      .get('/whoami')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.type(body['@context'], 'object')
    await tap.ok(Array.isArray(body['@context']))
    await tap.equal(body.type, 'Person')
    await tap.type(body.summaryMap, 'object')
    await tap.type(body.inbox, 'string')
    await tap.type(body.outbox, 'string')
    await tap.type(body.streams, 'object')
  })

  await tap.test('get user by userid', async () => {
    const res = await request(app)
      .get(urlparse(readerUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.type(body['@context'], 'object')
    await tap.ok(Array.isArray(body['@context']))
    await tap.equal(body.type, 'Person')
    await tap.type(body.summaryMap, 'object')
    await tap.type(body.inbox, 'string')
    await tap.type(body.outbox, 'string')
    await tap.type(body.streams, 'object')
  })

  await tap.test('Get Reader that does not exist', async () => {
    const res = await request(app)
      .get(urlparse(readerUrl).path + 'abc')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 404)
  })

  // if (!process.env.POSTGRE_INSTANCE) {
  await app.terminate()
  // }
  await destroyDB(app)
}

test()
