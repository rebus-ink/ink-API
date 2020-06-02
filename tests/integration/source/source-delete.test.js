const request = require('supertest')
const tap = require('tap')
const { urlToId } = require('../../../utils/utils')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  addSourceToCollection
} = require('../../utils/testUtils')

const { Tag } = require('../../../models/Tag')

const test = async app => {
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerId = urlToId(readerCompleteUrl)

  const now = new Date().toISOString()

  const sourceObject = {
    type: 'Book',
    name: 'Source A',
    author: ['John Smith'],
    editor: 'Jané S. Doe',
    abstract: 'this is a description!!',
    inLanguage: 'en',
    datePublished: now,
    links: [
      {
        url: 'http://example.org/abc',
        encodingFormat: 'text/html',
        name: 'An example link'
      }
    ],
    readingOrder: [
      {
        url: 'http://example.org/abc',
        encodingFormat: 'text/html',
        name: 'An example reading order object1'
      },
      {
        url: 'http://example.org/abc',
        encodingFormat: 'text/html',
        name: 'An example reading order object2'
      },
      {
        url: 'http://example.org/abc',
        encodingFormat: 'text/html',
        name: 'An example reading order object3'
      }
    ],
    resources: [
      {
        url: 'http://example.org/abc',
        encodingFormat: 'text/html',
        name: 'An example resource'
      }
    ],
    json: { property: 'value' }
  }

  const resCreateSource = await createSource(app, token, sourceObject)
  const sourceUrl = resCreateSource.id
  const sourceId = urlToId(resCreateSource.id)

  // second source
  await createSource(app, token)

  await tap.test('Delete Source', async () => {
    // Create a tag for testing purposes
    const createdTag = await Tag.createTag(readerId, {
      type: 'stack',
      name: 'mystack'
    })

    await addSourceToCollection(app, token, sourceId, createdTag.id)

    // before
    const before = await request(app)
      .get(`/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(before.body.items.length, 2)
    await tap.equal(before.body.items[1].tags.length, 1)
    await tap.equal(before.body.items[1].tags[0].name, 'mystack')

    const res = await request(app)
      .delete(`/sources/${sourceId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.statusCode, 204)

    // getting deleted source should return 404 error
    const getres = await request(app)
      .get(`/sources/${urlToId(sourceUrl)}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(getres.statusCode, 404)
    const error = JSON.parse(getres.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(
      error.message,
      `No Source found with id ${urlToId(sourceId)}`
    )
    await tap.equal(error.details.requestUrl, `/sources/${sourceId}`)

    // source should no longer be in the reader library
    const libraryres = await request(app)
      .get(`/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(libraryres.status, 200)
    const body = libraryres.body
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 1)
    await tap.equal(body.items[0].tags.length, 0)
  })

  await tap.test(
    'Try to delete a Source that was already deleted',
    async () => {
      const res = await request(app)
        .delete(`/sources/${sourceId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.error, 'Not Found')
      await tap.equal(error.message, `No Source found with id ${sourceId}`)
      await tap.equal(error.details.requestUrl, `/sources/${sourceId}`)
    }
  )

  await tap.test('Try to update Source that was already deleted', async () => {
    const res = await request(app)
      .patch(`/sources/${sourceId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify({ name: 'new name!!' }))

    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(error.message, `No Source found with id ${sourceId}`)
    await tap.equal(error.details.requestUrl, `/sources/${sourceId}`)
  })

  await tap.test('Try to delete a Source that does not exist', async () => {
    const res1 = await request(app)
      .delete(`/sources/1234`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res1.statusCode, 404)
    const error1 = JSON.parse(res1.text)
    await tap.equal(error1.statusCode, 404)
    await tap.equal(error1.error, 'Not Found')
    await tap.equal(error1.message, `No Source found with id 1234`)
    await tap.equal(error1.details.requestUrl, `/sources/1234`)
  })

  await destroyDB(app)
}

module.exports = test
