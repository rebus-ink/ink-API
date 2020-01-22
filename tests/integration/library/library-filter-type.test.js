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
    return await createPublication(readerId, object)
  }

  await createPublicationSimplified({
    name: 'Publication 1',
    type: 'Article'
  })
  await createPublicationSimplified({
    name: 'Publication 2',
    type: 'Book'
  })
  await createPublicationSimplified({
    name: 'Publication 3',
    type: 'Book'
  })

  await createPublicationSimplified({
    name: 'Publication 4',
    type: 'Book'
  })
  await createPublicationSimplified({
    name: 'Publication 5',
    type: 'Article'
  })
  await createPublicationSimplified({
    name: 'Publication 6',
    type: 'Article'
  })
  await createPublicationSimplified({
    name: 'Publication 7',
    type: 'Article'
  })
  await createPublicationSimplified({
    name: 'Publication 8',
    type: 'Article'
  })
  await createPublicationSimplified({
    name: 'Publication 9',
    type: 'Article'
  })
  await createPublicationSimplified({
    name: 'Publication 10',
    type: 'Article'
  })
  await createPublicationSimplified({
    name: 'Publication 11',
    type: 'Article'
  })
  await createPublicationSimplified({
    name: 'Publication 12',
    type: 'Article'
  })
  await createPublicationSimplified({
    name: 'Publication 13',
    type: 'Article'
  })
  await createPublicationSimplified({
    name: 'Publication 14',
    type: 'Article'
  })
  await createPublicationSimplified({
    name: 'Publication 15',
    type: 'Article'
  })

  await tap.test('Filter Library by type', async () => {
    const res = await request(app)
      .get(`/library?type=Book`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.status, 200)
    await tap.ok(res.body)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 3)
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 3)
    // documents should include:
    await tap.equal(body.items[0].type, 'Book')
    await tap.type(body.items[0].id, 'string')
    await tap.type(body.items[0].name, 'string')
    await tap.equal(body.items[0].name, 'Publication 4')
  })

  await tap.test('Filter Library by type is not case sensitive', async () => {
    const res = await request(app)
      .get(`/library?type=boOk`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.status, 200)
    await tap.ok(res.body)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 3)
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 3)
    // documents should include:
    await tap.equal(body.items[0].type, 'Book')
    await tap.type(body.items[0].id, 'string')
    await tap.type(body.items[0].name, 'string')
    await tap.equal(body.items[0].name, 'Publication 4')
  })

  await tap.test('Filter by type with pagination', async () => {
    const res2 = await request(app)
      .get(`/library?type=Article`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.body.items.length, 10)
    await tap.equal(res2.body.totalItems, 12)

    const res3 = await request(app)
      .get(`/library?type=Article&limit=11`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res3.body.items.length, 11)

    const res4 = await request(app)
      .get(`/library?type=Article&limit=11&page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res4.body.items.length, 1)
    await tap.equal(res4.body.totalItems, 12)
  })

  await tap.test('Filter by type that does not exist', async () => {
    const res = await request(app)
      .get(`/library?type=Stuff`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 0)
    await tap.equal(res.body.totalItems, 0)
  })

  await destroyDB(app)
}

module.exports = test
