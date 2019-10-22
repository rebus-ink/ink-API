const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  getActivityFromUrl,
  createPublication,
  createDocument
} = require('../utils/utils')

const { Document } = require('../../models/Document')
const { Reader } = require('../../models/Reader')
const { Tag } = require('../../models/Tag')
const { Publication_Tag } = require('../../models/Publications_Tags')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerUrl = urlparse(readerCompleteUrl).path

  // Create Reader object
  const person = {
    name: 'J. Random Reader'
  }

  const reader1 = await Reader.createReader(readerCompleteUrl, person)

  const now = new Date().toISOString()

  const publicationObject = {
    type: 'Publication',
    name: 'Publication A',
    author: ['John Smith'],
    editor: 'Jané S. Doe',
    description: 'this is a description!!',
    inLanguage: 'English',
    datePublished: now,
    links: [
      {
        '@context': 'https://www.w3.org/ns/activitystreams',
        href: 'http://example.org/abc',
        hreflang: 'en',
        mediaType: 'text/html',
        name: 'An example link'
      }
    ],
    readingOrder: [
      {
        '@context': 'https://www.w3.org/ns/activitystreams',
        href: 'http://example.org/abc',
        hreflang: 'en',
        mediaType: 'text/html',
        name: 'An example reading order object1'
      },
      {
        '@context': 'https://www.w3.org/ns/activitystreams',
        href: 'http://example.org/abc',
        hreflang: 'en',
        mediaType: 'text/html',
        name: 'An example reading order object2'
      },
      {
        '@context': 'https://www.w3.org/ns/activitystreams',
        href: 'http://example.org/abc',
        hreflang: 'en',
        mediaType: 'text/html',
        name: 'An example reading order object3'
      }
    ],
    resources: [
      {
        '@context': 'https://www.w3.org/ns/activitystreams',
        href: 'http://example.org/abc',
        hreflang: 'en',
        mediaType: 'text/html',
        name: 'An example resource'
      }
    ],
    json: { property: 'value' }
  }

  const resCreatePub = await createPublication(readerUrl, publicationObject)
  const publicationUrl = resCreatePub.id

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
    const createdTag = await Tag.createTag(reader1.id, {
      type: 'reader:Tag',
      tagType: 'reader:Stack',
      name: 'mystack'
    })

    await Publication_Tag.addTagToPub(publicationUrl, createdTag.id)

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
      .post(`${readerUrl}/activity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
      .send(
        JSON.stringify({
          '@context': [
            'https://www.w3.org/ns/activitystreams',
            { reader: 'https://rebus.foundation/ns/reader' }
          ],
          type: 'Delete',
          object: {
            type: 'Publication',
            id: publicationUrl
          }
        })
      )
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

    // Make sure documents associated with the publication are deleted
    const deletedDoc = await Document.byId(document.id)
    await tap.ok(deletedDoc.deleted)

    await tap.equal(libraryres.status, 200)
    const body = libraryres.body
    await tap.ok(Array.isArray(body.items))
    await tap.equal(body.items.length, 1)
    await tap.equal(body.items[0].tags.length, 0)
  })

  await tap.test(
    'Try to delete a Publication that was already deleted',
    async () => {
      const res = await request(app)
        .post(`${readerUrl}/activity`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )
        .send(
          JSON.stringify({
            '@context': [
              'https://www.w3.org/ns/activitystreams',
              { reader: 'https://rebus.foundation/ns/reader' }
            ],
            type: 'Delete',
            object: {
              type: 'Publication',
              id: publicationUrl
            }
          })
        )
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
        .post(`${readerUrl}/activity`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )
        .send(
          JSON.stringify({
            '@context': [
              'https://www.w3.org/ns/activitystreams',
              { reader: 'https://rebus.foundation/ns/reader' }
            ],
            type: 'Delete',
            object: {
              type: 'Publication',
              id: publicationUrl + '123'
            }
          })
        )
      await tap.equal(res1.statusCode, 404)
      const error1 = JSON.parse(res1.text)
      await tap.equal(error1.statusCode, 404)
      await tap.equal(error1.error, 'Not Found')
      await tap.equal(error1.details.type, 'Publication')
      await tap.type(error1.details.id, 'string')
      await tap.equal(error1.details.activity, 'Delete Publication')
    }
  )

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
