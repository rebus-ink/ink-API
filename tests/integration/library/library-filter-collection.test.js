const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  addSourceToCollection,
  createTag
} = require('../../utils/testUtils')
const app = require('../../../server').app

const test = async () => {
  const token = getToken()
  await createUser(app, token)

  const createSourceSimplified = async object => {
    return await createSource(app, token, object)
  }

  await createSourceSimplified({
    name: 'Source A'
  })

  let stack

  await tap.test('Filter Library by collection', async () => {
    // add more sources
    // source 2
    const source = await createSourceSimplified({
      name: 'Source 2'
    })

    // source 3
    await createSourceSimplified({ name: 'Source 3' })

    // create a stack
    stack = await createTag(app, token)

    // assign mystack to source B
    await addSourceToCollection(app, token, source.id, stack.id)

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
    await tap.equal(body.items[0].name, 'Source 2')
  })

  await tap.test('should work with pagination', async () => {
    await createSourceSimplified({ name: 'Source 4 test' })
    await createSourceSimplified({ name: 'Source 5' })
    await createSourceSimplified({ name: 'Source 6' })
    await createSourceSimplified({ name: 'Source 7 test' })
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

    // get whole library to get ids:
    const resLibrary = await request(app)
      .get(`/library?limit=20`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const library = resLibrary.body.items
    const sourceId1 = library[0].id
    const sourceId2 = library[1].id
    const sourceId3 = library[2].id
    const sourceId4 = library[3].id
    const sourceId5 = library[4].id
    const sourceId6 = library[5].id
    // skipping 7
    const sourceId8 = library[7].id
    const sourceId9 = library[8].id
    const sourceId10 = library[9].id
    const sourceId13 = library[12].id

    await addSourceToCollection(app, token, sourceId1, stack.id)
    await addSourceToCollection(app, token, sourceId2, stack.id)
    await addSourceToCollection(app, token, sourceId3, stack.id)
    await addSourceToCollection(app, token, sourceId4, stack.id)
    await addSourceToCollection(app, token, sourceId5, stack.id)
    await addSourceToCollection(app, token, sourceId6, stack.id)
    await addSourceToCollection(app, token, sourceId8, stack.id)
    await addSourceToCollection(app, token, sourceId9, stack.id)
    await addSourceToCollection(app, token, sourceId10, stack.id)
    await addSourceToCollection(app, token, sourceId13, stack.id)

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
