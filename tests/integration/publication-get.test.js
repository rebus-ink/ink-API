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
const _ = require('lodash')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerUrl = urlparse(readerCompleteUrl).path

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

  await tap.test('Get Publication', async () => {
    const res = await request(app)
      .get(urlparse(publicationUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res.statusCode, 200)

    const body = res.body

    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.ok(body.id.endsWith('/'))
    await tap.equal(body.type, 'Publication')
    await tap.equal(body.name, 'Publication A')
    await tap.ok(_.isArray(body.author))
    await tap.equal(body.author[0].name, 'John Smith')
    await tap.equal(body.editor[0].name, 'Jané S. Doe')
    await tap.equal(body.description, 'this is a description!!')
    await tap.ok(body.datePublished)
    await tap.equal(body.links[0].name, 'An example link')
    await tap.equal(
      body.readingOrder[1].name,
      'An example reading order object2'
    )
    await tap.equal(body.resources[0].name, 'An example resource')
    await tap.equal(body.json.property, 'value')
    await tap.ok(body.readerId)
    await tap.ok(body.published)
    await tap.ok(body.updated)
    await tap.equal(body.inLanguage, 'English')
    // should not have a position
    await tap.notOk(body.position)
  })

  await tap.test('Get Publication with a position', async () => {
    // create some read activity
    await request(app)
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
          type: 'Read',
          context: publicationUrl,
          'oa:hasSelector': {
            type: 'XPathSelector',
            value: '/html/body/p[2]/table/tr[2]/td[3]/span',
            property: 'first' // included for testing purposes
          }
        })
      )

    await request(app)
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
          type: 'Read',
          context: publicationUrl,
          'oa:hasSelector': {
            type: 'XPathSelector',
            value: '/html/body/p[2]/table/tr[3]/td[6]/span',
            property: 'last'
          }
        })
      )

    // get publication with position:
    const res = await request(app)
      .get(urlparse(publicationUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res.statusCode, 200)

    const body = res.body

    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.equal(body.type, 'Publication')
    await tap.equal(body.name, 'Publication A')
    await tap.type(body.position, 'object')
    await tap.equal(body.position.property, 'last')
  })

  await tap.test('Try to get Publication that does not exist', async () => {
    const res = await request(app)
      .get(urlparse(publicationUrl).path + 'abc')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(error.details.type, 'Publication')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Get Publication')
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
