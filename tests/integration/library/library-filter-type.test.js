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
    name: 'Source 1',
    type: 'Article'
  })
  await createSourceSimplified({
    name: 'Source 2',
    type: 'Book'
  })
  await createSourceSimplified({
    name: 'Source 3',
    type: 'Book'
  })

  await createSourceSimplified({
    name: 'Source 4',
    type: 'Book'
  })
  await createSourceSimplified({
    name: 'Source 5',
    type: 'Article'
  })
  await createSourceSimplified({
    name: 'Source 6',
    type: 'Article'
  })
  await createSourceSimplified({
    name: 'Source 7',
    type: 'Article'
  })
  await createSourceSimplified({
    name: 'Source 8',
    type: 'Article'
  })
  await createSourceSimplified({
    name: 'Source 9',
    type: 'Article'
  })
  await createSourceSimplified({
    name: 'Source 10',
    type: 'Article'
  })
  await createSourceSimplified({
    name: 'Source 11',
    type: 'Article'
  })
  await createSourceSimplified({
    name: 'Source 12',
    type: 'Article'
  })
  await createSourceSimplified({
    name: 'Source 13',
    type: 'Article'
  })
  await createSourceSimplified({
    name: 'Source 14',
    type: 'Article'
  })
  await createSourceSimplified({
    name: 'Source 15',
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
    await tap.equal(body.items[0].name, 'Source 4')
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
    await tap.equal(body.items[0].name, 'Source 4')
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
