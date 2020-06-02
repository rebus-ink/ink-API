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

  // -------------------------------------------DEFAULT ------------------------------------------

  await tap.test(
    'Get Library default order: most recently updated',
    async () => {
      const res = await request(app)
        .get(`/library`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.body.items[0].name, 'XXXX')
      await tap.equal(res.body.items[1].name, 'zzz')
      await tap.equal(res.body.items[2].name, 'ccccc')
      await tap.equal(res.body.items[3].name, 'abc')
    }
  )

  await tap.test(
    'Get Library default reverse order: most recently updated',
    async () => {
      const res = await request(app)
        .get(`/library?reverse=true`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.body.items[0].name, 'Source A')
      await tap.equal(res.body.items[1].name, 'Source 2')
      await tap.equal(res.body.items[2].name, 'Source 3')
      await tap.equal(res.body.items[3].name, 'Source 4')
    }
  )

  // -------------------------------------- INVALID ORDERBY ---------------------------------------

  await tap.test(
    'Try to order library by invalid orderBy criteria',
    async () => {
      const res = await request(app)
        .get(`/library?orderBy=sometingNotValid`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.body.items[0].name, 'XXXX')
      await tap.equal(res.body.items[1].name, 'zzz')
      await tap.equal(res.body.items[2].name, 'ccccc')
      await tap.equal(res.body.items[3].name, 'abc')
    }
  )

  await destroyDB(app)
}

module.exports = test
