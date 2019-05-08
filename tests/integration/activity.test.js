const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  getActivityFromUrl
} = require('./utils')
const { Document } = require('../../models/Document')
const { Reader } = require('../../models/Reader')
const { ReadActivity } = require('../../models/ReadActivity')
const { urlToId } = require('../../routes/utils')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const userId = await createUser(app, token)
  const userUrl = urlparse(userId).path
  let activityUrl

  // Create Reader object
  const person = {
    name: 'J. Random Reader'
  }
  const reader1 = await Reader.createReader(userId, person)

  // Create Publication
  const resActivity = await request(app)
    .post(`${userUrl}/activity`)
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
      .post(`${userUrl}/activity`)
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
            attributedTo: [
              {
                type: 'Person',
                name: 'Sample Author'
              }
            ],
            totalItems: 0,
            orderedItems: []
          }
        })
      )

    await tap.equal(res.status, 201)
    await tap.type(res.get('Location'), 'string')
    activityUrl = res.get('Location')
  })

  await tap.test('Get Activity', async () => {
    const res = await request(app)
      .get(urlparse(activityUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body

    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.equal(body.type, 'Create')
    await tap.type(body['@context'], 'object')
    await tap.ok(Array.isArray(body['@context']))
    await tap.equal(body.reader.id, userId)
    await tap.type(body.readerId, 'string')
    await tap.type(body.object, 'object')
    await tap.type(body.object.id, 'string')
    await tap.type(body.reader.summaryMap.en, 'string')
    await tap.type(body.actor, 'object')
    await tap.type(body.actor.id, 'string')
    await tap.equal(body.actor.type, 'Person')
  })

  await tap.test('Get Activity that does not exist', async () => {
    const res = await request(app)
      .get(urlparse(activityUrl).path + 'abc')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 404)
  })

  await tap.test('Create Read activity with only a selector', async () => {
    const readActivity = await request(app)
      .post(`${userUrl}/activity`)
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
            value: '/html/body/p[2]/table/tr[2]/td[3]/span'
          }
        })
      )

    // Get the latests ReadActivity
    const latestAct = await ReadActivity.getLatestReadActivity(
      urlToId(publicationUrl)
    )
    await tap.equal(readActivity.statusCode, 201)
    await tap.type(readActivity.get('Location'), 'string')
    await tap.equal(latestAct.id, readActivity.get('Location'))
    await tap.equal(latestAct.readerId, reader1.authId)
    await tap.equal(latestAct.publicationId, publicationUrl)
  })

  await tap.test('Create a ReadActivity with json', async () => {
    const readActivity = await request(app)
      .post(`${userUrl}/activity`)
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
          object: { type: 'Document', id: document.id },
          context: publicationUrl,
          'oa:hasSelector': {
            type: 'XPathSelector',
            value: '/html/body/p[2]/table/tr[2]/td[3]/span'
          },
          json: { property: 'value' }
        })
      )

    // Get the latests ReadActivity
    const latestAct = await ReadActivity.getLatestReadActivity(
      urlToId(publicationUrl)
    )

    await tap.equal(readActivity.statusCode, 201)
    await tap.equal(latestAct.json.property, 'value')
  })

  await destroyDB(app)
  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
}

module.exports = test
