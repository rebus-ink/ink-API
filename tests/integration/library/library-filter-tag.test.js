const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createTag,
  addSourceToCollection
} = require('../../utils/testUtils')
const app = require('../../../server').app
const { urlToId } = require('../../../utils/utils')

const test = async () => {
  const token = getToken()
  await createUser(app, token)

  const createSourceSimplified = async object => {
    return await createSource(app, token, object)
  }

  const tag1 = await createTag(app, token)
  const tag2 = await createTag(app, token, { name: 'test2' })
  // create a bunch of sources
  const source1 = await createSourceSimplified({
    name: 'source1'
  })
  sourceId1 = urlToId(source1.id)

  const source2 = await createSourceSimplified({
    name: 'source2'
  })
  sourceId2 = urlToId(source2.id)

  const source3 = await createSourceSimplified({
    name: 'source3'
  })
  sourceId3 = urlToId(source3.id)

  const source4 = await createSourceSimplified({
    name: 'source4'
  })
  sourceId4 = urlToId(source4.id)

  const source5 = await createSourceSimplified({
    name: 'source5'
  })
  sourceId5 = urlToId(source5.id)

  const source6 = await createSourceSimplified({
    name: 'source6'
  })
  sourceId6 = urlToId(source6.id)

  const source7 = await createSourceSimplified({
    name: 'source7'
  })
  sourceId7 = urlToId(source7.id)

  const source8 = await createSourceSimplified({
    name: 'source8'
  })
  sourceId8 = urlToId(source8.id)

  const source9 = await createSourceSimplified({
    name: 'source9'
  })
  sourceId9 = urlToId(source9.id)

  const source10 = await createSourceSimplified({
    name: 'source10'
  })
  sourceId10 = urlToId(source10.id)

  const source11 = await createSourceSimplified({
    name: 'source11'
  })
  sourceId11 = urlToId(source11.id)

  const source12 = await createSourceSimplified({
    name: 'source12'
  })
  sourceId12 = urlToId(source12.id)

  await createSourceSimplified({
    name: 'source13'
  })

  await createSourceSimplified({
    name: 'source13'
  })

  // assign sources to tags
  // source 1-11: tag1
  await addSourceToCollection(app, token, sourceId1, tag1.id)
  await addSourceToCollection(app, token, sourceId2, tag1.id)
  await addSourceToCollection(app, token, sourceId3, tag1.id)
  await addSourceToCollection(app, token, sourceId4, tag1.id)
  await addSourceToCollection(app, token, sourceId5, tag1.id)
  await addSourceToCollection(app, token, sourceId6, tag1.id)
  await addSourceToCollection(app, token, sourceId7, tag1.id)
  await addSourceToCollection(app, token, sourceId8, tag1.id)
  await addSourceToCollection(app, token, sourceId9, tag1.id)
  await addSourceToCollection(app, token, sourceId10, tag1.id)
  await addSourceToCollection(app, token, sourceId11, tag1.id)

  // source 10-12: tag2
  await addSourceToCollection(app, token, sourceId10, tag2.id)
  await addSourceToCollection(app, token, sourceId11, tag2.id)
  await addSourceToCollection(app, token, sourceId12, tag2.id)

  await tap.test('Filter Library by tag', async () => {
    const res = await request(app)
      .get(`/library?tag=${tag2.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 3)
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 3)
  })

  await tap.test('should work with pagination', async () => {
    const res = await request(app)
      .get(`/library?tag=${tag1.id}&limit=10`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 11)
    await tap.equal(body.items.length, 10)
  })

  await tap.test('Filter Library with a non-existing tag', async () => {
    const res = await request(app)
      .get(`/library?tag=${tag1.id}abc`)
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
