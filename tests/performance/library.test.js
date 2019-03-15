const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const { getToken, createUser, destroyDB } = require('../integration/utils')
const app = require('../../server').app

const createPublication = require('./utils/createPublication')

const test = async () => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const userId = await createUser(app, token)
  const userUrl = urlparse(userId).path

  await tap.test('Get library with 10 publications', async () => {
    const testName = 'get library with 10 publications'
    await createPublication(token, userUrl, 10)

    console.time(testName)
    const res = await request(app)
      .get(`${userUrl}/library`)
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
    await tap.equal(body.totalItems, 10)
  })

  await tap.test('Get library with 100 publications', async () => {
    const testName = 'get library with 100 publications'
    await createPublication(token, userUrl, 90) // adding to the 10 already there

    console.time(testName)
    const res = await request(app)
      .get(`${userUrl}/library`)
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

  await tap.test('Get library with 500 publications', async () => {
    const testName = 'get library with 500 publications'
    await createPublication(token, userUrl, 400) // adding to the 100 already there

    console.time(testName)
    const res = await request(app)
      .get(`${userUrl}/library`)
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
    await tap.equal(body.totalItems, 500)
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
