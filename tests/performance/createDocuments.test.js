const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const { getToken, createUser, destroyDB } = require('../integration/utils')
const app = require('../../server').app

const createPublication = require('./utils/createPublication')
const createDocument = require('./utils/createDocument')

const test = async () => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const userId = await createUser(app, token)
  const userUrl = urlparse(userId).path

  await createPublication(token, userUrl, 10)

  const res = await request(app)
    .get(`${userUrl}/library`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type(
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )

  const publicationUrl = res.body.items[0].id

  await tap.test('Create 10 documents', async () => {
    const testName = 'create 10 documents'
    console.time(testName)
    await createDocument(token, userUrl, publicationUrl, 10)
    console.timeEnd(testName)
  })

  await tap.test('Create 100 documents', async () => {
    const testName = 'create 100 documents'
    console.time(testName)
    await createDocument(token, userUrl, publicationUrl, 100)
    console.timeEnd(testName)
  })

  await tap.test('Create 500 documents', async () => {
    const testName = 'create 500 documents'
    console.time(testName)
    await createDocument(token, userUrl, publicationUrl, 500)
    console.timeEnd(testName)
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
