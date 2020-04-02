const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  addPubToCollection,
  createTag
} = require('../../utils/testUtils')
const app = require('../../../server').app
const { urlToId } = require('../../../utils/utils')

const test = async () => {
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerUrl = urlparse(readerCompleteUrl).path
  const readerId = urlToId(readerCompleteUrl)

  const createPublicationSimplified = async object => {
    return await createPublication(app, token, object)
  }

  await createPublicationSimplified({
    name: 'Publication A'
  })

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
    stack = await createTag(app, token)

    // assign mystack to publication B
    await addPubToCollection(app, token, publication.id, stack.id)

    // get library with filter for collection
    const res = await request(app)
      .get(`/library?stack=mystack`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

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
    await createPublicationSimplified({
      name: 'Publication 10'
    })
    await createPublicationSimplified({
      name: 'Publication 11'
    })
    await createPublicationSimplified({ name: 'Publication 12' })
    await createPublicationSimplified({
      name: 'Publication 13'
    })

    // get whole library to get ids:
    const resLibrary = await request(app)
      .get(`/library?limit=20`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

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

    await addPubToCollection(app, token, pubId1, stack.id)
    await addPubToCollection(app, token, pubId2, stack.id)
    await addPubToCollection(app, token, pubId3, stack.id)
    await addPubToCollection(app, token, pubId4, stack.id)
    await addPubToCollection(app, token, pubId5, stack.id)
    await addPubToCollection(app, token, pubId6, stack.id)
    await addPubToCollection(app, token, pubId8, stack.id)
    await addPubToCollection(app, token, pubId9, stack.id)
    await addPubToCollection(app, token, pubId10, stack.id)
    await addPubToCollection(app, token, pubId13, stack.id)

    // get library with filter for collection with pagination
    const res = await request(app)
      .get(`/library?stack=mystack&limit=10`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 11)
    await tap.equal(body.items.length, 10)
  })

  await tap.test('Filter Library with a non-existing collection', async () => {
    const res = await request(app)
      .get(`/library?stack=notastack`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 0)
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 0)
  })

  await destroyDB(app)
}

module.exports = test
