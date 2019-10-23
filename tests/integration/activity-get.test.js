const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  createActivity
} = require('../utils/utils')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const readerId = await createUser(app, token)
  const readerUrl = urlparse(readerId).path

  // create activity
  const createActivityResponse = await createActivity(app, token, readerUrl, {
    '@context': [
      'https://www.w3.org/ns/activitystreams',
      { reader: 'https://rebus.foundation/ns/reader' }
    ],
    type: 'Create',
    object: {
      type: 'reader:Tag',
      tagType: 'reader:Stack',
      name: 'mystack',
      json: { property: 'value' }
    }
  })

  const activityUrl = createActivityResponse.get('Location')

  await tap.test('Get Activity', async () => {
    const res = await request(app)
      .get(urlparse(activityUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body

    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.equal(body.type, 'Create')
    await tap.type(body['@context'], 'object')
    await tap.ok(Array.isArray(body['@context']))
    await tap.equal(body.reader.id, readerId)
    await tap.type(body.readerId, 'string')
    await tap.type(body.object, 'object')
    await tap.type(body.object.id, 'string')
    await tap.type(body.reader.summaryMap.en, 'string')
    await tap.type(body.actor, 'object')
    await tap.type(body.actor.id, 'string')
    await tap.equal(body.actor.type, 'Person')
  })

  await tap.test('Try to get Activity that does not exist', async () => {
    const res = await request(app)
      .get(urlparse(activityUrl).path + 'abc')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(error.details.type, 'Activity')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Get Activity')
  })

  await destroyDB(app)
  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
}

module.exports = test
