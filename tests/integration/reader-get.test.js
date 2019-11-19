const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const { getToken, destroyDB } = require('../utils/utils')

const test = async app => {
  const token = getToken()

  const createReaderRes = await request(app)
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
  const readerUrl = createReaderRes.get('Location')

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

  await tap.test('Get Reader by readerId', async () => {
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

  await tap.test('Try to get Reader that does not exist', async () => {
    const res = await request(app)
      .get(urlparse(readerUrl).path + 'abc')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(error.details.type, 'Reader')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Get Reader')
  })

  await destroyDB(app)
}

module.exports = test
