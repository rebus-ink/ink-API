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

  await createSourceSimplified({
    name: 'Source 10',
    inLanguage: ['de', 'km']
  })
  await createSourceSimplified({
    name: 'Source 11',
    inLanguage: 'km'
  })
  await createSourceSimplified({ name: 'Source 12' })
  await createSourceSimplified({
    name: 'Source 13',
    inLanguage: ['km']
  })

  await createSourceSimplified({
    name: 'new book 4 - the sequel',
    inLanguage: ['en']
  })
  await createSourceSimplified({
    name: 'new book 5',
    inLanguage: ['en']
  })
  await createSourceSimplified({
    name: 'new book 6',
    inLanguage: ['en']
  })
  await createSourceSimplified({
    name: 'new book 7',
    inLanguage: ['en']
  })
  await createSourceSimplified({
    name: 'new book 8 - the sequel',
    inLanguage: ['en']
  })
  await createSourceSimplified({
    name: 'new book 9',
    inLanguage: ['en', 'km']
  })
  await createSourceSimplified({
    name: 'new book 10',
    inLanguage: ['en']
  })
  await createSourceSimplified({
    name: 'new book 11',
    inLanguage: ['en']
  })
  await createSourceSimplified({
    name: 'new book 12',
    inLanguage: ['en']
  })
  await createSourceSimplified({
    name: 'new book 13',
    inLanguage: ['en']
  })
  await createSourceSimplified({
    name: 'new book 14',
    inLanguage: ['en', 'fr']
  })
  await createSourceSimplified({
    name: 'new book 15 - the sequel',
    inLanguage: ['fr']
  })

  await tap.test('Filter Library by language', async () => {
    const res = await request(app)
      .get(`/library?language=fr`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.status, 200)
    await tap.ok(res.body)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 2)
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 2)
    // documents should include:
    await tap.equal(body.items[0].type, 'Book')
    await tap.type(body.items[0].id, 'string')
    await tap.type(body.items[0].name, 'string')
    await tap.equal(body.items[0].name, 'new book 15 - the sequel')
  })

  await tap.test('Filter by language with pagination', async () => {
    const res2 = await request(app)
      .get(`/library?language=en`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.body.items.length, 10)
    await tap.equal(res2.body.totalItems, 11)

    const res3 = await request(app)
      .get(`/library?language=en&limit=11`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res3.body.items.length, 11)

    const res4 = await request(app)
      .get(`/library?language=en&limit=10&page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res4.body.items.length, 1)
    await tap.equal(res4.body.totalItems, 11)
  })

  await destroyDB(app)
}

module.exports = test
