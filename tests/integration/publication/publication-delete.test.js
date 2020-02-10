const request = require('supertest')
const tap = require('tap')
const { urlToId } = require('../../../utils/utils')
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createDocument,
  addPubToCollection
} = require('../../utils/testUtils')

const { Document } = require('../../../models/Document')
const { Tag } = require('../../../models/Tag')

const test = async app => {
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerId = urlToId(readerCompleteUrl)

  const now = new Date().toISOString()

  const publicationObject = {
    type: 'Book',
    name: 'Publication A',
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

  const resCreatePub = await createPublication(readerId, publicationObject)
  const publicationUrl = resCreatePub.id
  const publicationId = urlToId(resCreatePub.id)

  // second publication
  await createPublication(readerId)

  await tap.test('Delete Publication', async () => {
    // Create a Document for that publication
    const documentObject = {
      mediaType: 'txt',
      url: 'http://google-bucket/somewhere/file1234.txt',
      documentPath: '/inside/the/book.txt',
      json: { property1: 'value1' }
    }

    const document = await createDocument(
      readerCompleteUrl,
      publicationUrl,
      documentObject
    )

    // Create a tag for testing purposes
    const createdTag = await Tag.createTag(readerId, {
      type: 'stack',
      name: 'mystack'
    })

    await addPubToCollection(app, token, publicationId, createdTag.id)

    // before
    const before = await request(app)
      .get(`/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(before.body.items.length, 2)
    await tap.equal(before.body.items[1].tags.length, 1)
    await tap.equal(before.body.items[1].tags[0].name, 'mystack')
    await tap.ok(!document.deleted)

    const res = await request(app)
      .delete(`/publications/${publicationId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.statusCode, 204)

    // getting deleted publication should return 404 error
    const getres = await request(app)
      .get(`/publications/${urlToId(publicationUrl)}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(getres.statusCode, 404)
    const error = JSON.parse(getres.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(
      error.message,
      `No Publication found with id ${urlToId(publicationId)}`
    )
    await tap.equal(error.details.requestUrl, `/publications/${publicationId}`)

    // publication should no longer be in the reader library
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

    // Make sure documents associated with the publication are deleted
    const deletedDoc = await Document.byId(document.id)
    await tap.ok(deletedDoc.deleted)
  })

  await tap.test(
    'Try to delete a Publication that was already deleted',
    async () => {
      const res = await request(app)
        .delete(`/publications/${publicationId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.error, 'Not Found')
      await tap.equal(
        error.message,
        `No Publication found with id ${publicationId}`
      )
      await tap.equal(
        error.details.requestUrl,
        `/publications/${publicationId}`
      )
    }
  )

  await tap.test(
    'Try to update Publication that was already deleted',
    async () => {
      const res = await request(app)
        .patch(`/publications/${publicationId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(JSON.stringify({ name: 'new name!!' }))

      await tap.equal(res.statusCode, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.error, 'Not Found')
      await tap.equal(
        error.message,
        `No Publication found with id ${publicationId}`
      )
      await tap.equal(
        error.details.requestUrl,
        `/publications/${publicationId}`
      )
    }
  )

  await tap.test(
    'Try to delete a Publication that does not exist',
    async () => {
      const res1 = await request(app)
        .delete(`/publications/1234`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res1.statusCode, 404)
      const error1 = JSON.parse(res1.text)
      await tap.equal(error1.statusCode, 404)
      await tap.equal(error1.error, 'Not Found')
      await tap.equal(error1.message, `No Publication found with id 1234`)
      await tap.equal(error1.details.requestUrl, `/publications/1234`)
    }
  )

  await destroyDB(app)
}

module.exports = test
