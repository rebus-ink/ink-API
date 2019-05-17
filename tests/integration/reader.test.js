const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const { getToken, destroyDB } = require('./utils')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  // to avoid duplicate tokens:
  await new Promise(_func => setTimeout(_func, 50))
  const token2 = getToken()
  let readerUrl

  await tap.test('Create Reader', async () => {
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
          name: 'Jane Doe',
          profile: { property: 'value' },
          preferences: { favoriteColor: 'blueish brown' },
          json: { something: '!!!!' }
        })
      )
    await tap.equal(res.status, 201)
    await tap.type(res.get('Location'), 'string')
    readerUrl = res.get('Location')
  })

  await tap.test('Create Simple Reader', async () => {
    const res = await request(app)
      .post('/readers')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(
        JSON.stringify({
          '@context': 'https://www.w3.org/ns/activitystreams',
          name: 'Jane Doe'
        })
      )
    await tap.equal(res.status, 201)
    await tap.type(res.get('Location'), 'string')
  })

  // TODO: add test for incomplete reader object (once incoming json is validated)

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
    await tap.equal(body.name, 'Jane Doe')
    await tap.type(body.profile, 'object')
    await tap.equal(body.profile.property, 'value')
    await tap.type(body.preferences, 'object')
    await tap.equal(body.preferences.favoriteColor, 'blueish brown')
    await tap.type(body.json, 'object')
    await tap.equal(body.json.something, '!!!!')
  })

  await tap.test('get reader by readerId', async () => {
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
    await tap.equal(body.name, 'Jane Doe')
    await tap.type(body.profile, 'object')
    await tap.equal(body.profile.property, 'value')
    await tap.type(body.preferences, 'object')
    await tap.equal(body.preferences.favoriteColor, 'blueish brown')
    await tap.type(body.json, 'object')
    await tap.equal(body.json.something, '!!!!')
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

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
