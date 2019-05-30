const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  createPublication
} = require('../utils/utils')
const app = require('../../server').app

const test = async () => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerUrl = urlparse(readerCompleteUrl).path

  const createPublicationSimplified = async object => {
    return await createPublication(app, token, readerUrl, object)
  }

  await tap.test('paginate library', async () => {
    // create publications
    await createPublicationSimplified({
      name: 'Publication A',
      author: 'John Smith',
      editor: 'Jane Doe'
    })
    await createPublicationSimplified({ name: 'Publication 2' })
    await createPublicationSimplified({ name: 'Publication 3' })
    await createPublicationSimplified({ name: 'Publication 4' })
    await createPublicationSimplified({ name: 'Publication 5' })
    await createPublicationSimplified({ name: 'Publication 6' })
    await createPublicationSimplified({ name: 'Publication 7' })
    await createPublicationSimplified({ name: 'Publication 8' })
    await createPublicationSimplified({ name: 'Publication 9' })
    await createPublicationSimplified({ name: 'Publication 10' })
    await createPublicationSimplified({ name: 'Publication 11' })
    await createPublicationSimplified({ name: 'Publication 12' })
    await createPublicationSimplified({ name: 'Publication 13' })

    // get library with pagination
    const res = await request(app)
      .get(`${readerUrl}/library?limit=10`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 10)
    await tap.ok(Array.isArray(body.items))
    // documents should include:
    await tap.equal(body.items.length, 10)
    await tap.equal(body.items[0].name, 'Publication 13')
    await tap.equal(body.items[9].name, 'Publication 4')
    await tap.equal(body.page, 1)
    await tap.equal(body.pageSize, 10)

    // get page 2
    const res2 = await request(app)
      .get(`${readerUrl}/library?page=2&limit=10`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.statusCode, 200)

    const body2 = res2.body
    await tap.type(body2, 'object')
    await tap.equal(body2.totalItems, 3)
    await tap.ok(Array.isArray(body2.items))
    // documents should include:
    await tap.equal(body2.items.length, 3)
    await tap.equal(body2.items[0].name, 'Publication 3')
    await tap.equal(body2.items[2].name, 'Publication A')
    await tap.equal(body2.page, 2)
    await tap.equal(body2.pageSize, 10)

    // testing limit
    const res3 = await request(app)
      .get(`${readerUrl}/library?page=1&limit=0`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res3.body.totalItems, 10)

    // testing default
    const res4 = await request(app)
      .get(`${readerUrl}/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res4.body.totalItems, 10)
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
