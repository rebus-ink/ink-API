const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  getActivityFromUrl,
  createPublication,
  addPubToCollection,
  createTag
} = require('../utils/utils')
const app = require('../../server').app
const { urlToId } = require('../../utils/utils')

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
    editor: 'Jane Doe'
  })

  const publication = await createPublicationSimplified({
    name: 'Publication 2'
  })

  // publication 3
  await createPublicationSimplified({ name: 'Publication 3' })

  // create a stack
  const stack = await createTag(app, token, readerUrl)

  // assign mystack to publication B
  await addPubToCollection(app, token, readerUrl, publication.id, stack.id)

  await createPublicationSimplified({ name: 'Publication 4 test' })
  await createPublicationSimplified({ name: 'Publication 5' })
  await createPublicationSimplified({ name: 'Publication 6' })
  await createPublicationSimplified({ name: 'Publication 7 test' })
  await createPublicationSimplified({ name: 'Publication 8' })
  await createPublicationSimplified({ name: 'Publication 9' })
  await createPublicationSimplified({
    name: 'Publication 10',
    inLanguage: ['de', 'km']
  })
  await createPublicationSimplified({
    name: 'Publication 11',
    inLanguage: 'km'
  })
  await createPublicationSimplified({ name: 'Publication 12' })
  await createPublicationSimplified({
    name: 'Publication 13',
    inLanguage: ['km']
  })

  // get whole library to get ids:
  const resLibrary = await request(app)
    .get(`/readers/${readerId}/library?limit=20`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type(
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )

  const library = resLibrary.body.items
  const pubId1 = library[0].id
  const pubId2 = library[1].id
  const pubId3 = library[2].id
  const pubId4 = library[3].id
  const pubId5 = library[4].id
  const pubId6 = library[5].id
  // skipping 7
  const pubId8 = library[7].id
  const pubId9 = library[8].id
  const pubId10 = library[9].id
  const pubId13 = library[12].id

  await addPubToCollection(app, token, readerUrl, pubId1, stack.id)
  await addPubToCollection(app, token, readerUrl, pubId2, stack.id)
  await addPubToCollection(app, token, readerUrl, pubId3, stack.id)
  await addPubToCollection(app, token, readerUrl, pubId4, stack.id)
  await addPubToCollection(app, token, readerUrl, pubId5, stack.id)
  await addPubToCollection(app, token, readerUrl, pubId6, stack.id)
  await addPubToCollection(app, token, readerUrl, pubId8, stack.id)
  await addPubToCollection(app, token, readerUrl, pubId9, stack.id)
  await addPubToCollection(app, token, readerUrl, pubId10, stack.id)
  await addPubToCollection(app, token, readerUrl, pubId13, stack.id)

  await createPublicationSimplified({ name: 'superbook' })
  await createPublicationSimplified({ name: 'Super great book!' })

  await createPublicationSimplified({
    name: 'new book 1',
    author: 'John Doe',
    type: 'Article'
  })
  await createPublicationSimplified({
    name: 'new book 2 - the sequel',
    author: `jo H. n'dOe`,
    type: 'Article'
  })
  await createPublicationSimplified({
    name: 'new book 3',
    author: 'John Smith',
    editor: 'John doe',
    type: 'Article'
  })

  // adding for other attribution types
  await createPublicationSimplified({
    name: 'new book 3b',
    contributor: 'John Doe'
  })
  await createPublicationSimplified({
    name: 'new book 3c',
    creator: 'John Doe'
  })
  await createPublicationSimplified({
    name: 'new book 3d',
    illustrator: 'John Doe'
  })
  await createPublicationSimplified({
    name: 'new book 3e',
    publisher: 'John Doe'
  })
  await createPublicationSimplified({
    name: 'new book 3f',
    translator: 'John Doe'
  })

  await createPublicationSimplified({
    name: 'new book 4 - the sequel',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en']
  })
  await createPublicationSimplified({
    name: 'new book 5',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en']
  })
  await createPublicationSimplified({
    name: 'new book 6',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en']
  })
  await createPublicationSimplified({
    name: 'new book 7',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en']
  })
  await createPublicationSimplified({
    name: 'new book 8 - the sequel',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en'],
    type: 'Article'
  })
  await createPublicationSimplified({
    name: 'new book 9',
    author: 'Jane Smith',
    editor: 'John Doe',
    type: 'Article',
    inLanguage: ['en', 'km']
  })
  await createPublicationSimplified({
    name: 'new book 10',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en']
  })
  await createPublicationSimplified({
    name: 'new book 11',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en']
  })
  await createPublicationSimplified({
    name: 'new book 12',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en']
  })
  await createPublicationSimplified({
    name: 'new book 13',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en']
  })
  await createPublicationSimplified({
    name: 'new book 14',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en', 'fr']
  })
  await createPublicationSimplified({
    name: 'new book 15 - the sequel',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['fr']
  })

  await tap.test('filter by author and title', async () => {
    const res = await request(app)
      .get(`/readers/${readerId}/library?author=Jane%20Smith&title=sequel`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    const body = res.body
    await tap.equal(body.totalItems, 3)
    await tap.equal(body.items.length, 3)
  })

  await tap.test('filter by collection and language', async () => {
    const res = await request(app)
      .get(`/readers/${readerId}/library?stack=mystack&language=km`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    const body = res.body
    await tap.equal(body.totalItems, 3)
    await tap.equal(body.items.length, 3)
  })

  await tap.test('filter by author and language', async () => {
    const res = await request(app)
      .get(`/readers/${readerId}/library?author=Jane%20Smith&language=km`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    const body = res.body
    await tap.equal(body.totalItems, 1)
    await tap.equal(body.items.length, 1)
  })

  await tap.test('filter by attribution and title', async () => {
    const res = await request(app)
      .get(`/readers/${readerId}/library?attribution=John&title=sequel`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    const body = res.body
    await tap.equal(body.totalItems, 4)
    await tap.equal(body.items.length, 4)
  })

  await tap.test('filter by collection and title', async () => {
    const res = await request(app)
      .get(`/readers/${readerId}/library?stack=mystack&title=test`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    const body = res.body
    await tap.equal(body.totalItems, 1)
    await tap.equal(body.items.length, 1)
  })

  await tap.test('filter by author and type', async () => {
    const res = await request(app)
      .get(`/readers/${readerId}/library?author=John%20Doe&type=Article`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    const body = res.body
    await tap.equal(body.totalItems, 2)
    await tap.equal(body.items.length, 2)
  })

  await tap.test('filter by attribution and type', async () => {
    const res = await request(app)
      .get(`/readers/${readerId}/library?attribution=John%20Doe&type=Article`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    const body = res.body
    await tap.equal(body.totalItems, 5)
    await tap.equal(body.items.length, 5)
  })

  await tap.test('filter by title and type', async () => {
    const res = await request(app)
      .get(`/readers/${readerId}/library?title=sequel&type=Article`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    const body = res.body
    await tap.equal(body.totalItems, 2)
    await tap.equal(body.items.length, 2)
  })

  await tap.test('filter by language and type', async () => {
    const res = await request(app)
      .get(`/readers/${readerId}/library?language=km&type=Article`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    const body = res.body
    await tap.equal(body.totalItems, 1)
    await tap.equal(body.items.length, 1)
  })

  await destroyDB(app)
}

module.exports = test
