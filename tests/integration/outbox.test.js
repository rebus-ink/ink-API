const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const { getToken, createUser, destroyDB } = require('../utils/utils')
const { urlToId } = require('../../utils/utils')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }
  const token = getToken()
  const readerId = await createUser(app, token)
  const readerUrl = urlparse(readerId).path

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

  await tap.test('Try to Delete something that is not valid', async () => {
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
            type: 'SomethingInvalid'
          }
        })
      )

    await tap.equal(res.statusCode, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(error.details.badParams[0], 'object.type')
    await tap.equal(error.details.type, 'SomethingInvalid')
    await tap.equal(error.details.activity, 'Delete')
  })

  await tap.test('Try to Update something that is not valid', async () => {
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
          type: 'Update',
          object: {
            type: 'SomethingInvalid'
          }
        })
      )

    await tap.equal(res.statusCode, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(error.details.badParams[0], 'object.type')
    await tap.equal(error.details.type, 'SomethingInvalid')
    await tap.equal(error.details.activity, 'Update')
  })

  await tap.test('Get Outbox', async () => {
    const res = await request(app)
      .get(`${readerUrl}/activity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.type(body['@context'], 'string')
    await tap.equal(body.type, 'OrderedCollection')
    await tap.type(body.summaryMap, 'object')
    await tap.ok(Array.isArray(body.orderedItems))
    await tap.type(body.orderedItems[0], 'object')
    await tap.type(body.orderedItems[0].type, 'string')
    // await tap.equal(activity.target, 'Publication') // No target inserted into table
    await tap.equal(body.orderedItems[0].type, 'Create')
    // await tap.type(body.orderedItems[0].actor, 'object')
    // await tap.equal(body.orderedItems[0].actor.type, 'Person')
    await tap.equal(urlToId(body.orderedItems[0].readerId), urlToId(readerId))
    await tap.type(body.summaryMap, 'object')
    await tap.type(body.orderedItems[0].id, 'string')
  })

  await tap.test('Get Outbox for reader that does not exist', async () => {
    const res = await request(app)
      .get(`${readerUrl}abc/activity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(error.details.type, 'Reader')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Get Outbox')
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
