const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const { getToken, createUser, destroyDB } = require('../integration/utils')
const app = require('../../server').app

const createPublication = require('./utils/createPublication')
const createTags = require('./utils/createTags')

const test = async () => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const readerId = await createUser(app, token)
  const readerUrl = urlparse(readerId).path

  await createPublication(token, readerUrl, 100)

  await createTags(token, readerUrl, 100)

  const res = await request(app)
    .get(`${readerUrl}/library`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type(
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )

  const publicationUrl = res.body.items[0].id
  const tagId = res.body.tags[0].id

  await tap.test('Assign a tag to a publication', async () => {
    const testName = 'assign tag to publication'
    console.time(testName)
    const res1 = await request(app)
      .post(`${readerUrl}/activity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(
        JSON.stringify({
          '@context': [
            'https://www.w3.org/ns/activitystreams',
            { reader: 'https://rebus.foundation/ns/reader' }
          ],
          type: 'Add',
          object: { id: tagId, type: 'reader:Stack' },
          target: { id: publicationUrl, type: 'Publication' }
        })
      )
    console.timeEnd(testName)
    await tap.equal(res1.statusCode, 201)
  })

  await tap.test('Remove tag from a publication', async () => {
    const testName = 'remove tag from publication'
    console.time(testName)
    const res1 = await request(app)
      .post(`${readerUrl}/activity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(
        JSON.stringify({
          '@context': [
            'https://www.w3.org/ns/activitystreams',
            { reader: 'https://rebus.foundation/ns/reader' }
          ],
          type: 'Remove',
          object: { id: tagId, type: 'reader:Stack' },
          target: { id: publicationUrl }
        })
      )
    console.timeEnd(testName)
    await tap.equal(res1.statusCode, 201)
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
