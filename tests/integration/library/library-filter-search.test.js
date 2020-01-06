const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  createPublication
} = require('../../utils/testUtils')
const app = require('../../../server').app

const { urlToId } = require('../../../utils/utils')

const test = async () => {
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerUrl = urlparse(readerCompleteUrl).path
  const readerId = urlToId(readerCompleteUrl)

  const createPublicationSimplified = async object => {
    return await createPublication(readerId, object)
  }

  await createPublicationSimplified({ name: 'Publication 1' })
  await createPublicationSimplified({
    name: 'Publication 2',
    abstract: 'SUPER good book'
  })
  await createPublicationSimplified({
    name: 'Publication 3',
    keywords: ['super']
  })
  await createPublicationSimplified({
    name: 'Publication 4',
    description: 'super awesome'
  })
  await createPublicationSimplified({ name: 'Book 5', abstract: 'publication' })
  await createPublicationSimplified({ name: 'Book 6', keywords: 'publication' })
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
  await createPublicationSimplified({
    name: 'superbook',
    description: 'publication that is good'
  })
  await createPublicationSimplified({ name: 'Super great book!' })

  await tap.test(
    'Filter Library by searching through title, abstract, keywords and desription',
    async () => {
      const res = await request(app)
        .get(`/readers/${readerId}/library?search=super`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      await tap.ok(res.body)
      await tap.equal(res.body.totalItems, 5)
      await tap.ok(res.body.items)
      await tap.equal(res.body.items.length, 5)
    }
  )

  await tap.test('Filter Library by search with pagination', async () => {
    const res2 = await request(app)
      .get(`/readers/${readerId}/library?search=publication`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.body.totalItems, 14)
    await tap.equal(res2.body.items.length, 10)

    const res3 = await request(app)
      .get(`/readers/${readerId}/library?search=publication&limit=11`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res3.body.totalItems, 14)
    await tap.equal(res3.body.items.length, 11)
  })

  await tap.test(
    'Filter Library by search using inexistant title',
    async () => {
      const res4 = await request(app)
        .get(`/readers/${readerId}/library?search=ansoiwereow`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res4.body.totalItems, 0)
      await tap.equal(res4.body.items.length, 0)
    }
  )

  await destroyDB(app)
}

module.exports = test
