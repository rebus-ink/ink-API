const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  getActivityFromUrl,
  createPublication
} = require('../utils/utils')
const { Document } = require('../../models/Document')
const { Reader } = require('../../models/Reader')
const { ReadActivity } = require('../../models/ReadActivity')
const { urlToId } = require('../../utils/utils')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const readerId = await createUser(app, token)
  const readerUrl = urlparse(readerId).path
  let activityUrl

  // Create Reader object
  const person = {
    name: 'J. Random Reader'
  }
  const reader1 = await Reader.createReader(readerId, person)

  // Create Publication
  const resActivity = await createPublication(app, token, readerUrl)

  const activityUrl2 = resActivity.get('Location')
  const activityObject = await getActivityFromUrl(app, activityUrl2, token)
  const publicationUrl = activityObject.object.id

  const resPublication = await request(app)
    .get(urlparse(publicationUrl).path)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type(
      'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
    )

  // Create Document
  const documentObject = {
    mediaType: 'txt',
    url: 'http://google-bucket/somewhere/file1234.txt',
    documentPath: '/inside/the/book.txt',
    json: { property1: 'value1' }
  }

  const document = await Document.createDocument(
    reader1,
    resPublication.body.id,
    documentObject
  )

  await tap.test('Create Activity', async () => {
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
          type: 'Create',
          object: {
            type: 'Publication',
            name: 'Publication A',
            description: 'description of publication A',
            author: [
              { type: 'Person', name: 'Sample Author' },
              { type: 'Organization', name: 'Org inc.' }
            ],
            editor: ['Sample editor'],
            inLanguage: ['English'],
            keywords: ['key', 'words'],
            json: {
              property1: 'value1'
            },
            readingOrder: [
              {
                '@context': 'https://www.w3.org/ns/activitystreams',
                type: 'Link',
                href: 'http://example.org/abc',
                hreflang: 'en',
                mediaType: 'text/html',
                name: 'An example link'
              },
              {
                '@context': 'https://www.w3.org/ns/activitystreams',
                type: 'Link',
                href: 'http://example.org/abc2',
                hreflang: 'en',
                mediaType: 'text/html',
                name: 'An example link2'
              }
            ],
            links: [
              {
                '@context': 'https://www.w3.org/ns/activitystreams',
                type: 'Link',
                href: 'http://example.org/abc3',
                hreflang: 'en',
                mediaType: 'text/html',
                name: 'An example link3'
              },
              {
                '@context': 'https://www.w3.org/ns/activitystreams',
                type: 'Link',
                href: 'http://example.org/abc4',
                hreflang: 'en',
                mediaType: 'text/html',
                name: 'An example link4'
              }
            ],
            resources: [
              {
                '@context': 'https://www.w3.org/ns/activitystreams',
                type: 'Link',
                href: 'http://example.org/abc5',
                hreflang: 'en',
                mediaType: 'text/html',
                name: 'An example link5'
              },
              {
                '@context': 'https://www.w3.org/ns/activitystreams',
                type: 'Link',
                href: 'http://example.org/abc6',
                hreflang: 'en',
                mediaType: 'text/html',
                name: 'An example link6'
              }
            ]
          }
        })
      )

    await tap.equal(res.status, 201)
    await tap.type(res.get('Location'), 'string')
  })

  await tap.test('Try to create activity for non-existant reader', async () => {
    const res = await request(app)
      .post(`${readerUrl}abc/activity`)
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
          type: 'Create',
          object: {
            type: 'Publication',
            name: 'Publication A',
            readingOrder: [
              {
                '@context': 'https://www.w3.org/ns/activitystreams',
                type: 'Link',
                href: 'http://example.org/abc',
                hreflang: 'en',
                mediaType: 'text/html',
                name: 'An example link'
              },
              {
                '@context': 'https://www.w3.org/ns/activitystreams',
                type: 'Link',
                href: 'http://example.org/abc2',
                hreflang: 'en',
                mediaType: 'text/html',
                name: 'An example link2'
              }
            ]
          }
        })
      )

    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(error.details.type, 'Reader')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Create Activity')
  })

  await tap.test('Try to create activity without a body', async () => {
    const res = await request(app)
      .post(`${readerUrl}/activity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(error.details.activity, 'Create Activity')
  })

  await tap.test(
    'Try to create activity with invalid activity type',
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
            type: 'InvalidActivity123',
            object: {
              type: 'Publication',
              name: 'Publication A',
              readingOrder: [
                {
                  '@context': 'https://www.w3.org/ns/activitystreams',
                  type: 'Link',
                  href: 'http://example.org/abc',
                  hreflang: 'en',
                  mediaType: 'text/html',
                  name: 'An example link'
                },
                {
                  '@context': 'https://www.w3.org/ns/activitystreams',
                  type: 'Link',
                  href: 'http://example.org/abc2',
                  hreflang: 'en',
                  mediaType: 'text/html',
                  name: 'An example link2'
                }
              ]
            }
          })
        )

      await tap.equal(res.statusCode, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(error.details.badParams[0], 'body.type')
      await tap.equal(error.details.activity, 'Create Activity')
    }
  )

  await destroyDB(app)
  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
}

module.exports = test
