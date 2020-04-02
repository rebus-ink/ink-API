const request = require('supertest')
const tap = require('tap')
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
  const readerId = urlToId(readerCompleteUrl)

  const createPublicationSimplified = async object => {
    return await createPublication(app, token, object)
  }

  await createPublicationSimplified({
    name: 'Publication 1',
    keywords: ['one', 'two']
  })
  await createPublicationSimplified({
    name: 'Publication 2',
    keywords: ['one', 'two']
  })
  await createPublicationSimplified({
    name: 'Publication 3',
    keywords: ['one', 'two']
  })
  await createPublicationSimplified({
    name: 'Publication 4',
    keywords: ['one']
  })

  await createPublicationSimplified({
    name: 'new book 5',
    keywords: ['one']
  })
  await createPublicationSimplified({
    name: 'new book 6',
    keywords: ['one']
  })
  await createPublicationSimplified({
    name: 'new book 7',
    keywords: 'one'
  })
  await createPublicationSimplified({
    name: 'new book 8 - the sequel',
    keywords: ['one']
  })
  await createPublicationSimplified({
    name: 'new book 9',
    keywords: ['two']
  })
  await createPublicationSimplified({
    name: 'new book 10',
    keywords: ['two']
  })
  await createPublicationSimplified({
    name: 'new book 11',
    keywords: ['one']
  })
  await createPublicationSimplified({
    name: 'new book 12',
    keywords: ['one']
  })
  await createPublicationSimplified({
    name: 'new book 13',
    keywords: ['one']
  })
  await createPublicationSimplified({
    name: 'new book 14',
    keywords: ['one']
  })
  await createPublicationSimplified({
    name: 'new book 15 - the sequel',
    keywords: ['one']
  })
  await createPublicationSimplified({
    name: 'Publication 16',
    keywords: ['one']
  })
  await createPublicationSimplified({
    name: 'Publication 17',
    keywords: ['one']
  })

  await tap.test('Filter Library by keyword', async () => {
    const res = await request(app)
      .get(`/library?keyword=two`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.status, 200)
    await tap.ok(res.body)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 5)
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 5)
    // documents should include:
    await tap.equal(body.items[0].type, 'Book')
    await tap.type(body.items[0].id, 'string')
    await tap.type(body.items[0].name, 'string')
    await tap.equal(body.items[0].name, 'new book 10')
  })

  await tap.test('Filter Library by keyword - not case sensitive', async () => {
    const res = await request(app)
      .get(`/library?keyword=TwO`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.status, 200)
    await tap.ok(res.body)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 5)
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 5)
    // documents should include:
    await tap.equal(body.items[0].type, 'Book')
    await tap.type(body.items[0].id, 'string')
    await tap.type(body.items[0].name, 'string')
    await tap.equal(body.items[0].name, 'new book 10')
  })

  await tap.test('Filter by keyword with pagination', async () => {
    const res2 = await request(app)
      .get(`/library?keyword=one`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.body.items.length, 10)
    await tap.equal(res2.body.totalItems, 15)

    const res3 = await request(app)
      .get(`/library?keyword=one&limit=11`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res3.body.items.length, 11)

    const res4 = await request(app)
      .get(`/library?keyword=one&limit=12&page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res4.body.items.length, 3)
    await tap.equal(res4.body.totalItems, 15)
  })

  await destroyDB(app)
}

module.exports = test
