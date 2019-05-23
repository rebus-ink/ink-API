const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const { getToken, createUser, destroyDB } = require('../integration/utils')
const app = require('../../server').app
const { Document } = require('../../models/Document')
const { urlToId } = require('../../routes/utils')

const createPublication = require('./utils/createPublication')
const createNotes = require('./utils/createNotes')

const test = async () => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }
  const token = getToken()
  const userId = await createUser(app, token)
  const userUrl = urlparse(userId).path

  await createPublication(token, userUrl, 10)

  const reslib = await request(app)
    .get(`${userUrl}/library`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type(
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )

  const publicationUrl = reslib.body.items[0].id

  await Document.createDocument(
    { id: urlToId(userId) },
    urlToId(publicationUrl),
    {
      documentPath: '/path/1',
      mediaType: 'text/html',
      url: 'http://something/123'
    }
  )

  const documentUrl = `${publicationUrl}path/1`

  await tap.test('Get notes for reader with 10 notes', async () => {
    const testName = 'get notes for reader with 10 notes'
    await createNotes(token, userUrl, publicationUrl, documentUrl, 10)

    console.time(testName)
    const res = await request(app)
      .get(`${userUrl}/notes`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    console.timeEnd(testName)

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.items.length, 10)
  })

  await tap.test('Get notes for user with 100 notes', async () => {
    const testName = 'get notes for user with 100 notes'
    await createNotes(token, userUrl, publicationUrl, documentUrl, 90)

    console.time(testName)
    const res = await request(app)
      .get(`${userUrl}/notes?limit=100`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    console.timeEnd(testName)

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 100)
  })

  await tap.test('Get notes for reader with 500 notes', async () => {
    const testName = 'get 100 notes from reader with 500 notes'
    await createNotes(token, userUrl, publicationUrl, documentUrl, 400)

    console.time(testName)
    const res = await request(app)
      .get(`${userUrl}/notes?limit=100`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    console.timeEnd(testName)

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 100)
  })

  await tap.test('Get notes for reader with 1000 notes', async () => {
    const testName =
      'get 100 notes from last page of notes collection with 1000 notes'
    await createNotes(token, userUrl, publicationUrl, documentUrl, 500)

    console.time(testName)
    const res = await request(app)
      .get(`${userUrl}/notes?limit=100&page=10`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    console.timeEnd(testName)

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 100)
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
