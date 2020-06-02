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
  await createSourceSimplified({ name: 'Source 2' })
  await createSourceSimplified({ name: 'Source 3' })
  await createSourceSimplified({ name: 'Source 4' })
  await createSourceSimplified({ name: 'Source 5' })
  await createSourceSimplified({ name: 'Source 6' })
  await createSourceSimplified({ name: 'Source 7' })
  await createSourceSimplified({ name: 'Source 8' })
  await createSourceSimplified({ name: 'Source 9' })
  await createSourceSimplified({
    name: 'Source 10'
  })
  await createSourceSimplified({
    name: 'Source 11'
  })
  await createSourceSimplified({ name: 'Source 12' })
  await createSourceSimplified({
    name: 'Source 13'
  })
  await createSourceSimplified({ name: 'superbook' })
  await createSourceSimplified({ name: 'Super great book!' })

  await tap.test('Filter Library by title', async () => {
    const res = await request(app)
      .get(`/library?title=super`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 2)
    await tap.ok(res.body.items)
    await tap.equal(res.body.items.length, 2)
    await tap.equal(res.body.items[0].name, 'Super great book!')
  })

  await tap.test('Filter Library by title with pagination', async () => {
    const res2 = await request(app)
      .get(`/library?title=source`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.body.totalItems, 13)
    await tap.equal(res2.body.items.length, 10)

    const res3 = await request(app)
      .get(`/library?title=source&limit=11`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res3.body.totalItems, 13)
    await tap.equal(res3.body.items.length, 11)
  })

  await tap.test('Filter Library by title using inexistant title', async () => {
    const res4 = await request(app)
      .get(`/library?title=ansoiwereow`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res4.body.totalItems, 0)
    await tap.equal(res4.body.items.length, 0)
  })

  await destroyDB(app)
}

module.exports = test
