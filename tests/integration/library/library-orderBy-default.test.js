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
    return await createPublication(readerUrl, object)
  }

  await createPublicationSimplified({
    name: 'Publication A',
    author: 'John Smith',
    editor: 'Jane Doe',
    datePublished: undefined
  })
  await createPublicationSimplified({ name: 'Publication 2' })
  await createPublicationSimplified({ name: 'Publication 3' })
  await createPublicationSimplified({ name: 'Publication 4' })
  await createPublicationSimplified({ name: 'Publication 5' })
  await createPublicationSimplified({ name: 'Publication 6' })
  await createPublicationSimplified({ name: 'Publication 7' })
  await createPublicationSimplified({ name: 'Publication 8' })
  await createPublicationSimplified({ name: 'Publication 9' })
  await createPublicationSimplified({ name: 'Publication 10' })
  await createPublicationSimplified({ name: 'Publication 11' })
  await createPublicationSimplified({ name: 'Publication 12' })
  await createPublicationSimplified({ name: 'Publication 13' })
  await createPublicationSimplified({ name: 'superbook' })
  await createPublicationSimplified({ name: 'Super great book!' })

  await createPublicationSimplified({
    name: 'new book 1',
    author: 'John Doe'
  })
  await createPublicationSimplified({
    name: 'new book 2',
    author: `jo H. n'dOe`
  })
  await createPublicationSimplified({
    name: 'new book 3',
    author: 'John Smith',
    editor: 'John doe'
  })
  await createPublicationSimplified({
    name: 'new book 4',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createPublicationSimplified({
    name: 'new book 5',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createPublicationSimplified({
    name: 'new book 6',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createPublicationSimplified({
    name: 'new book 7',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createPublicationSimplified({
    name: 'new book 8',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createPublicationSimplified({
    name: 'new book 9',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createPublicationSimplified({
    name: 'new book 10',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createPublicationSimplified({
    name: 'new book 11',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createPublicationSimplified({
    name: 'new book 12',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createPublicationSimplified({
    name: 'new book 13',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createPublicationSimplified({
    name: 'new book 14',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createPublicationSimplified({
    name: 'new book 15',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createPublicationSimplified({ name: 'BBBB' })
  await createPublicationSimplified({ name: 'AAAA' })
  await createPublicationSimplified({ name: 'aabb' })
  await createPublicationSimplified({ name: 'ffff' })
  await createPublicationSimplified({ name: 'ffaa' })
  await createPublicationSimplified({ name: 'abc' })
  await createPublicationSimplified({ name: 'ccccc', author: 'anonymous' })
  await createPublicationSimplified({ name: 'zzz', author: 'Anonymous' })
  await createPublicationSimplified({ name: 'XXXX', author: 'anonyMOUS' })

  // -------------------------------------------DEFAULT ------------------------------------------

  await tap.test(
    'Get Library default order: most recently updated',
    async () => {
      const res = await request(app)
        .get(`/readers/${readerId}/library`)
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
        .get(`/readers/${readerId}/library?reverse=true`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.body.items[0].name, 'Publication A')
      await tap.equal(res.body.items[1].name, 'Publication 2')
      await tap.equal(res.body.items[2].name, 'Publication 3')
      await tap.equal(res.body.items[3].name, 'Publication 4')
    }
  )

  // -------------------------------------- INVALID ORDERBY ---------------------------------------

  await tap.test(
    'Try to order library by invalid orderBy criteria',
    async () => {
      const res = await request(app)
        .get(`/readers/${readerId}/library?orderBy=sometingNotValid`)
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
