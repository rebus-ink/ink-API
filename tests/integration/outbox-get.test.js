const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  createActivity
} = require('../utils/utils')
const { urlToId } = require('../../utils/utils')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }
  const token = getToken()
  const readerId = await createUser(app, token)
  const readerUrl = urlparse(readerId).path

  await tap.test('Get empty outbox', async () => {
    const res = await request(app)
      .get(`${readerUrl}/activity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.type(body['@context'], 'string')
    await tap.equal(body.type, 'OrderedCollection')
    await tap.type(body.summaryMap, 'object')
    await tap.ok(Array.isArray(body.orderedItems))
    await tap.equal(body.orderedItems.length, 0)
  })

  // create activity
  await createActivity(app, token, readerUrl, {
    type: 'Create',
    object: {
      type: 'reader:Tag',
      tagType: 'reader:Stack',
      name: 'mystack',
      json: { property: 'value' }
    }
  })

  await createActivity(app, token, readerUrl)
  await createActivity(app, token, readerUrl)

  await tap.test('Get Outbox', async () => {
    const res = await request(app)
      .get(`${readerUrl}/activity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.type(body['@context'], 'string')
    await tap.equal(body.type, 'OrderedCollection')
    await tap.type(body.summaryMap, 'object')
    await tap.ok(Array.isArray(body.orderedItems))
    await tap.equal(body.orderedItems.length, 1)
    await tap.type(body.orderedItems[0], 'object')
    await tap.type(body.orderedItems[0].type, 'string')
    await tap.equal(body.orderedItems[0].type, 'Create')
    await tap.equal(urlToId(body.orderedItems[0].readerId), urlToId(readerId))
    await tap.type(body.summaryMap, 'object')
    await tap.type(body.orderedItems[0].id, 'string')
  })

  await tap.test(
    'Try to get Outbox for reader that does not exist',
    async () => {
      const res = await request(app)
        .get(`${readerUrl}abc/activity`)
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
      await tap.equal(error.details.activity, 'Get Outbox')
    }
  )

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
