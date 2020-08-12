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

  const source1 = await createSourceSimplified({
    name: 'Source 1'
  })

  const stack = await createTag(app, token, { name: 'mystack' })
  const stack2 = await createTag(app, token, { name: 'mystack2' })

  await addSourceToCollection(app, token, source1.shortId, stack.id)

  await tap.test('Filter Library by collection', async () => {
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
    await tap.equal(body.items[0].name, 'Source 1')
  })

  const source2 = await createSourceSimplified({
    name: 'Source 2'
  })
  const source3 = await createSourceSimplified({ name: 'Source 3' })
  const source4 = await createSourceSimplified({ name: 'Source 4 test' })
  const source5 = await createSourceSimplified({ name: 'Source 5' })
  const source6 = await createSourceSimplified({ name: 'Source 6' })
  const source7 = await createSourceSimplified({ name: 'Source 7 test' })
  const source8 = await createSourceSimplified({ name: 'Source 8' })
  const source9 = await createSourceSimplified({ name: 'Source 9' })
  const source10 = await createSourceSimplified({
    name: 'Source 10'
  })
  const source11 = await createSourceSimplified({
    name: 'Source 11'
  })
  // source12
  await createSourceSimplified({ name: 'Source 12' })
  const source13 = await createSourceSimplified({
    name: 'Source 13'
  })

  await addSourceToCollection(app, token, source2.shortId, stack.id)
  await addSourceToCollection(app, token, source3.shortId, stack.id)
  await addSourceToCollection(app, token, source4.shortId, stack.id)
  await addSourceToCollection(app, token, source5.shortId, stack.id)
  await addSourceToCollection(app, token, source6.shortId, stack.id)
  await addSourceToCollection(app, token, source8.shortId, stack.id) // skipped 7
  await addSourceToCollection(app, token, source9.shortId, stack.id)
  await addSourceToCollection(app, token, source10.shortId, stack.id)
  await addSourceToCollection(app, token, source11.shortId, stack.id)
  await addSourceToCollection(app, token, source13.shortId, stack.id) // skipped 12

  await tap.test('should work with pagination', async () => {
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

  await addSourceToCollection(app, token, source1.shortId, stack2.id)
  await addSourceToCollection(app, token, source2.shortId, stack2.id)
  await addSourceToCollection(app, token, source3.shortId, stack2.id)
  await addSourceToCollection(app, token, source4.shortId, stack2.id)
  await addSourceToCollection(app, token, source7.shortId, stack2.id) // not in first stack

  await tap.test('Filter Library by two stacks', async () => {
    // get library with filter for collection
    const res = await request(app)
      .get(`/library?stack=mystack&stack=mystack2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 4)
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 4)
  })

  await addSourceToCollection(app, token, source5.shortId, stack2.id)
  await addSourceToCollection(app, token, source6.shortId, stack2.id)
  await addSourceToCollection(app, token, source8.shortId, stack2.id)
  await addSourceToCollection(app, token, source9.shortId, stack2.id)
  await addSourceToCollection(app, token, source10.shortId, stack2.id)
  await addSourceToCollection(app, token, source11.shortId, stack2.id)
  await addSourceToCollection(app, token, source13.shortId, stack2.id)

  await tap.test('Filter Library by two stacks with pagination', async () => {
    // get library with filter for collection
    const res = await request(app)
      .get(`/library?stack=mystack&stack=mystack2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 11)
    await tap.ok(Array.isArray(body.items))
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
