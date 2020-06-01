const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const _ = require('lodash')
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createTag,
  addPubToCollection
} = require('../../utils/testUtils')
const app = require('../../../server').app
const { urlToId } = require('../../../utils/utils')

const test = async () => {
  const token = getToken()
  await createUser(app, token)

  const createPublicationSimplified = async object => {
    return await createPublication(app, token, object)
  }

  const tag1 = await createTag(app, token)
  const tag2 = await createTag(app, token, { name: 'test2' })
  // create a bunch of publications
  const pub1 = await createPublicationSimplified({
    name: 'pub1'
  })
  pubId1 = urlToId(pub1.id)

  const pub2 = await createPublicationSimplified({
    name: 'pub2'
  })
  pubId2 = urlToId(pub2.id)

  const pub3 = await createPublicationSimplified({
    name: 'pub3'
  })
  pubId3 = urlToId(pub3.id)

  const pub4 = await createPublicationSimplified({
    name: 'pub4'
  })
  pubId4 = urlToId(pub4.id)

  const pub5 = await createPublicationSimplified({
    name: 'pub5'
  })
  pubId5 = urlToId(pub5.id)

  const pub6 = await createPublicationSimplified({
    name: 'pub6'
  })
  pubId6 = urlToId(pub6.id)

  const pub7 = await createPublicationSimplified({
    name: 'pub7'
  })
  pubId7 = urlToId(pub7.id)

  const pub8 = await createPublicationSimplified({
    name: 'pub8'
  })
  pubId8 = urlToId(pub8.id)

  const pub9 = await createPublicationSimplified({
    name: 'pub9'
  })
  pubId9 = urlToId(pub9.id)

  const pub10 = await createPublicationSimplified({
    name: 'pub10'
  })
  pubId10 = urlToId(pub10.id)

  const pub11 = await createPublicationSimplified({
    name: 'pub11'
  })
  pubId11 = urlToId(pub11.id)

  const pub12 = await createPublicationSimplified({
    name: 'pub12'
  })
  pubId12 = urlToId(pub12.id)

  await createPublicationSimplified({
    name: 'pub13'
  })

  await createPublicationSimplified({
    name: 'pub13'
  })

  // assign pubs to tags
  // pub 1-11: tag1
  await addPubToCollection(app, token, pubId1, tag1.id)
  await addPubToCollection(app, token, pubId2, tag1.id)
  await addPubToCollection(app, token, pubId3, tag1.id)
  await addPubToCollection(app, token, pubId4, tag1.id)
  await addPubToCollection(app, token, pubId5, tag1.id)
  await addPubToCollection(app, token, pubId6, tag1.id)
  await addPubToCollection(app, token, pubId7, tag1.id)
  await addPubToCollection(app, token, pubId8, tag1.id)
  await addPubToCollection(app, token, pubId9, tag1.id)
  await addPubToCollection(app, token, pubId10, tag1.id)
  await addPubToCollection(app, token, pubId11, tag1.id)

  // pub 10-12: tag2
  await addPubToCollection(app, token, pubId10, tag2.id)
  await addPubToCollection(app, token, pubId11, tag2.id)
  await addPubToCollection(app, token, pubId12, tag2.id)

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
