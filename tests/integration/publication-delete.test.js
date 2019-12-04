const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const { urlToId } = require('../../utils/utils')
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createDocument,
  addPubToCollection
} = require('../utils/utils')

const { Document } = require('../../models/Document')
const { Tag } = require('../../models/Tag')

const test = async app => {
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerId = urlToId(readerCompleteUrl)
  const readerUrl = urlparse(readerCompleteUrl).path

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

  const resCreatePub = await createPublication(readerUrl, publicationObject)
  const publicationUrl = resCreatePub.id
  const publicationId = urlToId(resCreatePub.id)

  // second publication
  await createPublication(readerUrl)

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
      type: 'reader:Tag',
      tagType: 'reader:Stack',
      name: 'mystack'
    })

    await addPubToCollection(
      app,
      token,
      readerUrl,
      publicationId,
      createdTag.id
    )

    // before
    const before = await request(app)
      .get(`${readerUrl}/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(before.body.items.length, 2)
    await tap.equal(before.body.items[1].tags.length, 1)
    await tap.equal(before.body.items[1].tags[0].name, 'mystack')
    await tap.ok(!document.deleted)

    const res = await request(app)
      .delete(`/readers/${readerId}/publications/${publicationId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.statusCode, 204)

    // getting deleted publication should return 404 error
    const getres = await request(app)
      .get(urlparse(publicationUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(getres.statusCode, 404)
    const error = JSON.parse(getres.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(error.details.type, 'Publication')
    await tap.type(error.details.id, 'string')

    // publication should no longer be in the reader library
    const libraryres = await request(app)
      .get(`${readerUrl}/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

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
        .delete(`/readers/${readerId}/publications/${publicationId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.error, 'Not Found')
      await tap.equal(error.details.type, 'Publication')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Delete Publication')
    }
  )

  await tap.test(
    'Try to delete a Publication that does not exist',
    async () => {
      const res1 = await request(app)
        .delete(`/readers/${readerId}/publications/1234`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res1.statusCode, 404)
      const error1 = JSON.parse(res1.text)
      await tap.equal(error1.statusCode, 404)
      await tap.equal(error1.error, 'Not Found')
      await tap.equal(error1.details.type, 'Publication')
      await tap.type(error1.details.id, 'string')
      await tap.equal(error1.details.activity, 'Delete Publication')
    }
  )

  await destroyDB(app)
}

module.exports = test
