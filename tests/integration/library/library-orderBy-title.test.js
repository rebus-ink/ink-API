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
    name: 'Source A',
    author: 'John Smith',
    editor: 'Jane Doe',
    datePublished: undefined
  })
  await createSourceSimplified({ name: 'Source 2' })
  await createSourceSimplified({ name: 'Source 3' })
  await createSourceSimplified({ name: 'Source 4' })
  await createSourceSimplified({ name: 'Source 5' })
  await createSourceSimplified({ name: 'Source 6' })
  await createSourceSimplified({ name: 'Source 7' })
  await createSourceSimplified({ name: 'Source 8' })
  await createSourceSimplified({ name: 'Source 9' })
  await createSourceSimplified({ name: 'Source 10' })
  await createSourceSimplified({ name: 'Source 11' })
  await createSourceSimplified({ name: 'Source 12' })
  await createSourceSimplified({ name: 'Source 13' })
  await createSourceSimplified({ name: 'superbook' })
  await createSourceSimplified({ name: 'Super great book!' })

  await createSourceSimplified({
    name: 'new book 1',
    author: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 2',
    author: `jo H. n'dOe`
  })
  await createSourceSimplified({
    name: 'new book 3',
    author: 'John Smith',
    editor: 'John doe'
  })
  await createSourceSimplified({
    name: 'new book 4',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 5',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 6',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 7',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 8',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 9',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 10',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 11',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 12',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 13',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 14',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 15',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({ name: 'BBBB' })
  await createSourceSimplified({ name: 'AAAA' })
  await createSourceSimplified({ name: 'aabb' })
  await createSourceSimplified({ name: 'ffff' })
  await createSourceSimplified({ name: 'ffaa' })
  await createSourceSimplified({ name: 'abc' })
  await createSourceSimplified({ name: 'ccccc', author: 'anonymous' })
  await createSourceSimplified({ name: 'zzz', author: 'Anonymous' })
  await createSourceSimplified({ name: 'XXXX', author: 'anonyMOUS' })

  // -------------------------------------------- TITLE -------------------------------------------

  await tap.test('Order Library by title', async () => {
    const res = await request(app)
      .get(`/library?orderBy=title`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.body.items[0].name, 'AAAA')
    await tap.equal(res.body.items[1].name, 'aabb')
    await tap.equal(res.body.items[2].name, 'abc')
  })

  await tap.test('Order Library by title with filter by title', async () => {
    const res1 = await request(app)
      .get(`/library?orderBy=title&title=b`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res1.body.items[0].name, 'aabb')
    await tap.equal(res1.body.items[1].name, 'abc')
  })

  await tap.test('Order Library by title with filter by author', async () => {
    const res2 = await request(app)
      .get(`/library?orderBy=title&author=anonymous`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.body.items.length, 3)

    await tap.equal(res2.body.items[0].name, 'ccccc')
    await tap.equal(res2.body.items[1].name, 'XXXX')
    await tap.equal(res2.body.items[2].name, 'zzz')
  })

  await tap.test(
    'Order Library by title with filter by attribution',
    async () => {
      const res3 = await request(app)
        .get(`/library?orderBy=title&attribution=anonymous`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res3.body.items.length, 3)

      await tap.equal(res3.body.items[0].name, 'ccccc')
      await tap.equal(res3.body.items[1].name, 'XXXX')
      await tap.equal(res3.body.items[2].name, 'zzz')
    }
  )

  await tap.test('Order Library by title, reversed', async () => {
    const res = await request(app)
      .get(`/library?orderBy=title&reverse=true`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.body.items[0].name, 'zzz')
    await tap.equal(res.body.items[1].name, 'XXXX')
  })

  await tap.test(
    'Order Library by title reversed with filter by title',
    async () => {
      const res1 = await request(app)
        .get(`/library?orderBy=title&title=ff&reverse=true`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res1.body.items[0].name, 'ffff')
      await tap.equal(res1.body.items[1].name, 'ffaa')
    }
  )

  await tap.test(
    'Order Library by title reversed with filter by author',
    async () => {
      const res2 = await request(app)
        .get(`/library?orderBy=title&author=anonymous&reverse=true`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res2.body.items.length, 3)

      await tap.equal(res2.body.items[0].name, 'zzz')
      await tap.equal(res2.body.items[1].name, 'XXXX')
      await tap.equal(res2.body.items[2].name, 'ccccc')
    }
  )

  await tap.test(
    'Order Library by title reversed with filter by attribution',
    async () => {
      const res3 = await request(app)
        .get(`/library?orderBy=title&attribution=anonymous&reverse=true`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res3.body.items.length, 3)

      await tap.equal(res3.body.items[0].name, 'zzz')
      await tap.equal(res3.body.items[1].name, 'XXXX')
      await tap.equal(res3.body.items[2].name, 'ccccc')
    }
  )

  await tap.test('Order Library by title with pagination', async () => {
    const res = await request(app)
      .get(`/library?orderBy=title&limit=16`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    // most recent first
    await tap.equal(res.body.items.length, 16)
  })

  await destroyDB(app)
}

module.exports = test
