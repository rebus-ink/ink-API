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

const test = async () => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerUrl = urlparse(readerCompleteUrl).path

  const createPublicationSimplified = async object => {
    return await createPublication(readerUrl, object)
  }

  await createPublicationSimplified({
    name: 'Publication A',
    author: 'John Smith',
    editor: 'Jane Doe'
  })

  // ------------------------------------ COLLECTION ---------------------------------------

  let stack

  await tap.test('Filter Library by collection', async () => {
    // add more publications
    // publication 2
    const publication = await createPublicationSimplified({
      name: 'Publication 2'
    })

    // publication 3
    await createPublicationSimplified({ name: 'Publication 3' })

    // create a stack
    const stackRes = await createTag(app, token, readerUrl)

    const stackActivityUrl = stackRes.get('Location')
    const stackActivityObject = await getActivityFromUrl(
      app,
      stackActivityUrl,
      token
    )

    stack = stackActivityObject.object
    // assign mystack to publication B
    await addPubToCollection(app, token, readerUrl, publication.id, stack.id)

    // get library with filter for collection
    const res = await request(app)
      .get(`${readerUrl}/library?stack=mystack`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 1)
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 1)
    // documents should include:
    await tap.equal(body.items[0].name, 'Publication 2')
  })

  await tap.test('should work with pagination', async () => {
    await createPublicationSimplified({ name: 'Publication 4 test' })
    await createPublicationSimplified({ name: 'Publication 5' })
    await createPublicationSimplified({ name: 'Publication 6' })
    await createPublicationSimplified({ name: 'Publication 7 test' })
    await createPublicationSimplified({ name: 'Publication 8' })
    await createPublicationSimplified({ name: 'Publication 9' })
    await createPublicationSimplified({ name: 'Publication 10' })
    await createPublicationSimplified({ name: 'Publication 11' })
    await createPublicationSimplified({ name: 'Publication 12' })
    await createPublicationSimplified({ name: 'Publication 13' })

    // get whole library to get ids:
    const resLibrary = await request(app)
      .get(`${readerUrl}/library?limit=20`)
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

    // get library with filter for collection with pagination
    const res = await request(app)
      .get(`${readerUrl}/library?stack=mystack&limit=10`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 11)
    await tap.equal(body.items.length, 10)
  })

  await tap.test('Filter Library with a non-existing collection', async () => {
    const res = await request(app)
      .get(`${readerUrl}/library?stack=notastack`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 0)
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 0)
  })

  // ---------------------------------------- TITLE ------------------------------------

  await tap.test('Filter Library by title', async () => {
    await createPublicationSimplified({ name: 'superbook' })
    await createPublicationSimplified({ name: 'Super great book!' })

    const res = await request(app)
      .get(`${readerUrl}/library?title=super`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 2)
    await tap.ok(res.body.items)
    await tap.equal(res.body.items.length, 2)
    await tap.equal(res.body.items[0].name, 'Super great book!')
  })

  await tap.test('Filter Library by title with pagination', async () => {
    const res2 = await request(app)
      .get(`${readerUrl}/library?title=publication`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.body.totalItems, 13)
    await tap.equal(res2.body.items.length, 10)

    const res3 = await request(app)
      .get(`${readerUrl}/library?title=publication&limit=11`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res3.body.totalItems, 13)
    await tap.equal(res3.body.items.length, 11)
  })

  await tap.test('Filter Library by title using inexistant title', async () => {
    const res4 = await request(app)
      .get(`${readerUrl}/library?title=ansoiwereow`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res4.body.totalItems, 0)
    await tap.equal(res4.body.items.length, 0)
  })

  // ------------------------------------ ATTRIBUTION ------------------------------------

  await createPublicationSimplified({
    name: 'new book 1',
    author: 'John Doe'
  })
  await createPublicationSimplified({
    name: 'new book 2 - the sequel',
    author: `jo H. n'dOe`
  })
  await createPublicationSimplified({
    name: 'new book 3',
    author: 'John Smith',
    editor: 'John doe'
  })

  await tap.test('Filter Library by attribution', async () => {
    const res = await request(app)
      .get(`${readerUrl}/library?attribution=John%20Doe`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res.status, 200)
    await tap.ok(res.body)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.equal(body.type, 'Collection')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 3)
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 3)
    // documents should include:
    await tap.equal(body.items[0].type, 'Publication')
    await tap.type(body.items[0].id, 'string')
    await tap.type(body.items[0].name, 'string')
    await tap.equal(body.items[0].name, 'new book 3')
    await tap.equal(body.items[0].author[0].name, 'John Smith')
  })

  await tap.test(
    'Filter Library by attribution should work with partial matches',
    async () => {
      const res1 = await request(app)
        .get(`${readerUrl}/library?attribution=John d`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )

      await tap.equal(res1.body.items.length, 3)
    }
  )

  await createPublicationSimplified({
    name: 'new book 4 - the sequel',
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
    name: 'new book 8 - the sequel',
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
    name: 'new book 15 - the sequel',
    author: 'Jane Smith',
    editor: 'John Doe'
  })

  await tap.test('Filter by attribution with pagination', async () => {
    const res2 = await request(app)
      .get(`${readerUrl}/library?attribution=John%20Doe`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.body.items.length, 10)

    const res3 = await request(app)
      .get(`${readerUrl}/library?attribution=John%20Doe&limit=11`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res3.body.items.length, 11)

    const res4 = await request(app)
      .get(`${readerUrl}/library?attribution=John%20Doe&limit=11&page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res4.body.items.length, 4)
  })

  await tap.test(
    'Filter Library by attribution with unknown author',
    async () => {
      const res = await request(app)
        .get(`${readerUrl}/library?attribution=XYZABC`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )

      await tap.equal(res.statusCode, 200)
      await tap.equal(res.body.items.length, 0)
    }
  )

  // ---------------------------------------- ATTRIBUTION + ROLE -----------------------------------

  await tap.test('Filter Library by attribution and role', async () => {
    const res = await request(app)
      .get(`${readerUrl}/library?attribution=John%20D&role=author`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.items.length, 2)
  })

  await tap.test(
    'Filter Library by attribution and role with pagination',
    async () => {
      const res2 = await request(app)
        .get(`${readerUrl}/library?attribution=John%20D&role=editor`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )

      await tap.equal(res2.body.items.length, 10)

      const res3 = await request(app)
        .get(`${readerUrl}/library?attribution=John%20D&role=editor&page=2`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )

      await tap.equal(res3.body.items.length, 3)
    }
  )

  await tap.test(
    'Filter Library by attribution with invalid role returns empty library',
    async () => {
      const res = await request(app)
        .get(`${readerUrl}/library?attribution=John%20D&role=autho`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )

      await tap.equal(res.statusCode, 200)
      await tap.equal(res.body.items.length, 0)
    }
  )

  // ------------------------------------------ AUTHOR ---------------------------------------

  await tap.test('Filter Library by author', async () => {
    const res = await request(app)
      .get(`${readerUrl}/library?author=John%20Doe`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res.status, 200)
    await tap.ok(res.body)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.type, 'Collection')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 2)
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 2)
    // documents should include:
    await tap.equal(body.items[0].type, 'Publication')
    await tap.type(body.items[0].id, 'string')
    await tap.type(body.items[0].name, 'string')
    await tap.equal(body.items[0].name, 'new book 2 - the sequel')
    await tap.equal(body.items[0].author[0].name, `jo H. n'dOe`)
  })

  await tap.test('Filter Library by author with pagination', async () => {
    const res2 = await request(app)
      .get(`${readerUrl}/library?author=JaneSmith`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.body.items.length, 10)

    const res3 = await request(app)
      .get(`${readerUrl}/library?author=JaneSmith&limit=11`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res3.body.items.length, 11)

    const res4 = await request(app)
      .get(`${readerUrl}/library?author=JaneSmith&limit=11&page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res4.body.items.length, 1)
  })

  await tap.test(
    'Filter Library by author should not work with partial matches',
    async () => {
      const res = await request(app)
        .get(`${readerUrl}/library?author=Doe`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )
      await tap.equal(res.status, 200)
      await tap.ok(res.body)

      const body = res.body
      await tap.type(body, 'object')
      await tap.equal(body.type, 'Collection')
      await tap.equal(body.items.length, 0)
    }
  )

  // ------------------------------------------- COMBINED FILTERS ------------------------------

  await tap.test('filter by author and title', async () => {
    const res = await request(app)
      .get(`${readerUrl}/library?author=Jane%20Smith&title=sequel`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    const body = res.body
    await tap.equal(body.totalItems, 3)
    await tap.equal(body.items.length, 3)
  })

  await tap.test('filter by attribution and title', async () => {
    const res = await request(app)
      .get(`${readerUrl}/library?attribution=John&title=sequel`)
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
      .get(`${readerUrl}/library?stack=mystack&title=test`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    const body = res.body
    await tap.equal(body.totalItems, 1)
    await tap.equal(body.items.length, 1)
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
