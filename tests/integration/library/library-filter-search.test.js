const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource
} = require('../../utils/testUtils')
const app = require('../../../server').app

const test = async () => {
  const token = getToken()
  await createUser(app, token)

  const createSourceSimplified = async object => {
    return await createSource(app, token, object)
  }

  await createSourceSimplified({ name: 'Source 1' })
  await createSourceSimplified({
    name: 'Source 2',
    abstract: 'SUPER good book'
  })
  await createSourceSimplified({
    name: 'Source 3',
    keywords: ['super']
  })
  await createSourceSimplified({
    name: 'Source 4',
    description: 'super awesome'
  })
  await createSourceSimplified({ name: 'Book 5', abstract: 'source' })
  await createSourceSimplified({ name: 'Book 6', keywords: 'source' })
  await createSourceSimplified({ name: 'Source 7' })
  await createSourceSimplified({ name: 'Source 8' })
  await createSourceSimplified({ name: 'Source 9' })
  await createSourceSimplified({
    name: 'Source 10',
    author: 'super dude!'
  })
  await createSourceSimplified({
    name: 'Source 11'
  })
  await createSourceSimplified({ name: 'Source 12' })
  await createSourceSimplified({
    name: 'Source 13'
  })
  await createSourceSimplified({
    name: 'superbook',
    description: 'source that is good'
  })
  await createSourceSimplified({ name: 'Super great book!' })

  await tap.test(
    'Filter Library by searching through title, abstract, keywords, author and desription',
    async () => {
      const res = await request(app)
        .get(`/library?search=super`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      await tap.ok(res.body)
      await tap.equal(res.body.totalItems, 6)
      await tap.ok(res.body.items)
      await tap.equal(res.body.items.length, 6)
    }
  )

  await tap.test('Filter Library by search with pagination', async () => {
    const res2 = await request(app)
      .get(`/library?search=source`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.body.totalItems, 14)
    await tap.equal(res2.body.items.length, 10)

    const res3 = await request(app)
      .get(`/library?search=source&limit=11`)
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
        .get(`/library?search=ansoiwereow`)
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
