const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const { getToken, createUser, destroyDB } = require('../utils/utils')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerUrl = urlparse(readerCompleteUrl).path

  const now = new Date().toISOString()

  await tap.test('Create Publication', async () => {
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
        })
      )

    await tap.equal(res.status, 201)
    await tap.type(res.get('Location'), 'string')
    activityUrl = res.get('Location')
  })

  await tap.test('Create Simple Publication', async () => {
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
            readingOrder: [
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
                name: 'An example reading order object'
              },
              {
                '@context': 'https://www.w3.org/ns/activitystreams',
                href: 'http://example.org/abc',
                hreflang: 'en',
                mediaType: 'text/html',
                name: 'An example reading order object3'
              }
            ]
          }
        })
      )

    await tap.equal(res.status, 201)
    await tap.type(res.get('Location'), 'string')
  })

  await tap.test('Try to create a publication without a name', async () => {
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
            readingOrder: [
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
                name: 'An example reading order object'
              },
              {
                '@context': 'https://www.w3.org/ns/activitystreams',
                href: 'http://example.org/abc',
                hreflang: 'en',
                mediaType: 'text/html',
                name: 'An example reading order object3'
              }
            ]
          }
        })
      )

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(error.details.type, 'Publication')
    await tap.equal(error.details.activity, 'Create Publication')
    await tap.type(error.details.validation, 'object')
    await tap.equal(error.details.validation.name[0].keyword, 'required')
    await tap.equal(
      error.details.validation.name[0].params.missingProperty,
      'name'
    )
  })

  await tap.test(
    'Try to create a publication without a reading order',
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
            type: 'Create',
            object: {
              type: 'Publication',
              name: 'Publication A'
            }
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(error.details.type, 'Publication')
      await tap.equal(error.details.activity, 'Create Publication')
      await tap.type(error.details.validation, 'object')
      await tap.equal(
        error.details.validation.readingOrder[0].keyword,
        'required'
      )
      await tap.equal(
        error.details.validation.readingOrder[0].params.missingProperty,
        'readingOrder'
      )
    }
  )

  await tap.test(
    'Try to create a publication with an empty readingOrder',
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
            type: 'Create',
            object: {
              type: 'Publication',
              name: 'Publication A',
              readingOrder: []
            }
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(error.details.type, 'Publication')
      await tap.equal(error.details.activity, 'Create Publication')
      await tap.type(error.details.validation, 'object')
      await tap.equal(
        error.details.validation.readingOrder[0].keyword,
        'required'
      )
      await tap.equal(
        error.details.validation.readingOrder[0].params.missingProperty,
        'readingOrder'
      )
    }
  )

  await tap.test(
    'Try to create a publication with a parameter of the wrong type',
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
            type: 'Create',
            object: {
              type: 'Publication',
              name: 'my publication',
              description: 123,
              readingOrder: [
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
                  name: 'An example reading order object'
                },
                {
                  '@context': 'https://www.w3.org/ns/activitystreams',
                  href: 'http://example.org/abc',
                  hreflang: 'en',
                  mediaType: 'text/html',
                  name: 'An example reading order object3'
                }
              ]
            }
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(error.details.type, 'Publication')
      await tap.equal(error.details.activity, 'Create Publication')
      await tap.type(error.details.validation, 'object')
      await tap.equal(error.details.validation.description[0].keyword, 'type')
      await tap.equal(
        error.details.validation.description[0].params.type,
        'string'
      )
    }
  )

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
