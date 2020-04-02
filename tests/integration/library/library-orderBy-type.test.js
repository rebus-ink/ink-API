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
    type: 'Article',
    author: 'anonymous'
  })
  await createPublicationSimplified({
    name: 'Publication 2',
    type: 'Manuscript'
  })
  await createPublicationSimplified({
    name: 'Publication 3',
    type: 'Book',
    illustrator: 'anonymous'
  })

  await tap.test('Order Library by type', async () => {
    const res = await request(app)
      .get(`/library?orderBy=type`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.body.items[0].name, 'Publication 1')
    await tap.equal(res.body.items[1].name, 'Publication 3')
    await tap.equal(res.body.items[2].name, 'Publication 2')
  })

  await tap.test('Order Library by type, reversed', async () => {
    const res = await request(app)
      .get(`/library?orderBy=type&reverse=true`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.body.items[0].name, 'Publication 2')
    await tap.equal(res.body.items[1].name, 'Publication 3')
    await tap.equal(res.body.items[2].name, 'Publication 1')
  })

  await createPublicationSimplified({ name: 'zbc', type: 'Book' })
  await createPublicationSimplified({
    name: 'ZZZ',
    type: 'Manuscript',
    author: 'anonymous'
  })
  await createPublicationSimplified({ name: 'zzz', type: 'Article' })

  await tap.test('Order Library by type with filter by title', async () => {
    const res1 = await request(app)
      .get(`/library?orderBy=type&title=z`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res1.body.items.length, 3)
    await tap.equal(res1.body.items[0].name, 'zzz')
    await tap.equal(res1.body.items[1].name, 'zbc')
    await tap.equal(res1.body.items[2].name, 'ZZZ')
  })

  await tap.test('Order Library by type with filter by author', async () => {
    const res2 = await request(app)
      .get(`/library?orderBy=type&author=anonymous`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.body.items.length, 2)

    await tap.equal(res2.body.items[0].name, 'Publication 1')
    await tap.equal(res2.body.items[1].name, 'ZZZ')
  })

  await tap.test(
    'Order Library by type with filter by attribution',
    async () => {
      const res3 = await request(app)
        .get(`/library?orderBy=type&attribution=anonymous`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res3.body.items.length, 3)

      await tap.equal(res3.body.items[0].name, 'Publication 1')
      await tap.equal(res3.body.items[1].name, 'Publication 3')
      await tap.equal(res3.body.items[2].name, 'ZZZ')
    }
  )

  await createPublicationSimplified({ name: 'zbc', type: 'Book' })
  await createPublicationSimplified({ name: 'zbc', type: 'Book' })
  await createPublicationSimplified({ name: 'zbc', type: 'Book' })
  await createPublicationSimplified({ name: 'zbc', type: 'Book' })
  await createPublicationSimplified({ name: 'zbc', type: 'Book' })
  await createPublicationSimplified({ name: 'zbc', type: 'Book' })
  await createPublicationSimplified({ name: 'zbc', type: 'Book' })
  await createPublicationSimplified({ name: 'zbc', type: 'Book' })
  await createPublicationSimplified({ name: 'zbc', type: 'Book' })
  await createPublicationSimplified({ name: 'zbc', type: 'Book' })
  await createPublicationSimplified({ name: 'zbc', type: 'Book' })
  await createPublicationSimplified({ name: 'zbc', type: 'Book' })

  await tap.test('Order Library by type with pagination', async () => {
    const res = await request(app)
      .get(`/library?orderBy=type&limit=16`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.body.items.length, 16)
    await tap.equal(res.body.items[0].type, 'Article')
  })

  await destroyDB(app)
}

module.exports = test
