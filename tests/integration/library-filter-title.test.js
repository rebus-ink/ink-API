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

const { urlToId } = require('../../utils/utils')

const test = async () => {
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerUrl = urlparse(readerCompleteUrl).path
  const readerId = urlToId(readerCompleteUrl)

  const createPublicationSimplified = async object => {
    return await createPublication(readerUrl, object)
  }

  await createPublicationSimplified({ name: 'Publication 1' })
  await createPublicationSimplified({ name: 'Publication 2' })
  await createPublicationSimplified({ name: 'Publication 3' })
  await createPublicationSimplified({ name: 'Publication 4' })
  await createPublicationSimplified({ name: 'Publication 5' })
  await createPublicationSimplified({ name: 'Publication 6' })
  await createPublicationSimplified({ name: 'Publication 7' })
  await createPublicationSimplified({ name: 'Publication 8' })
  await createPublicationSimplified({ name: 'Publication 9' })
  await createPublicationSimplified({
    name: 'Publication 10'
  })
  await createPublicationSimplified({
    name: 'Publication 11'
  })
  await createPublicationSimplified({ name: 'Publication 12' })
  await createPublicationSimplified({
    name: 'Publication 13'
  })
  await createPublicationSimplified({ name: 'superbook' })
  await createPublicationSimplified({ name: 'Super great book!' })

  await tap.test('Filter Library by title', async () => {
    const res = await request(app)
      .get(`/readers/${readerId}/library?title=super`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 2)
    await tap.ok(res.body.items)
    await tap.equal(res.body.items.length, 2)
    await tap.equal(res.body.items[0].name, 'Super great book!')
  })

  await tap.test('Filter Library by title with pagination', async () => {
    const res2 = await request(app)
      .get(`/readers/${readerId}/library?title=publication`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.body.totalItems, 13)
    await tap.equal(res2.body.items.length, 10)

    const res3 = await request(app)
      .get(`/readers/${readerId}/library?title=publication&limit=11`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res3.body.totalItems, 13)
    await tap.equal(res3.body.items.length, 11)
  })

  await tap.test('Filter Library by title using inexistant title', async () => {
    const res4 = await request(app)
      .get(`/readers/${readerId}/library?title=ansoiwereow`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res4.body.totalItems, 0)
    await tap.equal(res4.body.items.length, 0)
  })

  await destroyDB(app)
}

module.exports = test
