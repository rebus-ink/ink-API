const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const { getToken, destroyDB } = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()

  const createReaderRes = await request(app)
    .post('/readers')
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')
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
  let readerId

  await tap.test('Whoami route', async () => {
    const res = await request(app)
      .get('/whoami')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.equal(body.name, 'Jane Doe')
    await tap.type(body.profile, 'object')
    await tap.equal(body.profile.property, 'value')
    await tap.type(body.preferences, 'object')
    await tap.equal(body.preferences.favoriteColor, 'blueish brown')
    await tap.type(body.json, 'object')
    await tap.equal(body.json.something, '!!!!')

    readerId = urlToId(body.id)
  })

  await tap.test('Get Reader by readerId', async () => {
    const res = await request(app)
      .get(`/readers/${readerId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.equal(body.name, 'Jane Doe')
    await tap.type(body.profile, 'object')
    await tap.equal(body.profile.property, 'value')
    await tap.type(body.preferences, 'object')
    await tap.equal(body.preferences.favoriteColor, 'blueish brown')
    await tap.type(body.json, 'object')
    await tap.equal(body.json.something, '!!!!')
  })

  await tap.test('Use reader id url to get the reader', async () => {
    const res = await request(app)
      .get(urlparse(readerUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
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
      .get(`/readers/${readerId}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

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
