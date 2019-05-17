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
  const readerId = await createUser(app, token)
  const readerUrl = urlparse(readerId).path

  await createPublication(token, readerUrl, 10)

  const res = await request(app)
    .get(`${readerUrl}/library`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type(
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )

  const publicationUrl = res.body.items[0].id

  const resPublication = await request(app)
    .get(urlparse(publicationUrl).path)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type(
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )

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

  await tap.test('Create 10 notes', async () => {
    const testName = 'create 10 notes'
    console.time(testName)
    await createNotes(token, readerUrl, publicationUrl, documentUrl, 10)
    console.timeEnd(testName)
  })

  await tap.test('Create 100 notes', async () => {
    const testName = 'create 100 notes'
    console.time(testName)
    await createNotes(token, readerUrl, publicationUrl, documentUrl, 100)
    console.timeEnd(testName)
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
