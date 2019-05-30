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
const { urlToId } = require('../../utils/utils')
const { Attribution } = require('../../models/Attribution')
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

  const resCreatePub = await createPublication(
    app,
    token,
    readerUrl,
    publicationObject
  )
  const activityUrl = resCreatePub.get('Location')
  const activityObject = await getActivityFromUrl(app, activityUrl, token)
  const publicationUrl = activityObject.object.id

  await tap.test('Update a publication', async () => {
    // const timestamp = new Date(2018, 01, 30).toISOString()
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
            type: 'Publication',
            id: publicationUrl,
            name: 'New name for pub A',
            // datePublished: timestamp,
            description: 'New description for Publication',
            json: { property: 'New value for json property' },
            inLanguage: ['Swahili', 'French'],
            keywords: ['newKeyWord1', 'newKeyWord2'],
            author: [
              { type: 'Person', name: 'New Sample Author' },
              { type: 'Organization', name: 'New Org inc.' }
            ],
            editor: [{ type: 'Person', name: 'New Sample Editor' }]
          }
        })
      )

    await tap.equal(res.status, 201)
    await tap.type(res.get('Location'), 'string')

    const updateActivityUrl = res.get('Location')

    const updateActivityObject = await getActivityFromUrl(
      app,
      updateActivityUrl,
      token
    )
    const newPublicationUrl = updateActivityObject.object.id

    const resPub = await request(app)
      .get(urlparse(newPublicationUrl).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(resPub.statusCode, 200)

    const body = resPub.body

    const attributions = await Attribution.getAttributionByPubId(
      urlToId(body.id)
    )

    await tap.equal(body.name, 'New name for pub A')
    await tap.equal(body.description, 'New description for Publication')
    // await tap.equal(body.datePublished, timestamp)
    await tap.equal(body.json.property, 'New value for json property')
    await tap.equal(body.inLanguage[0], 'Swahili')
    await tap.equal(body.inLanguage[1], 'French')
    await tap.equal(body.keywords[0], 'newKeyWord1')
    await tap.equal(body.keywords[1], 'newKeyWord2')
    await tap.ok(
      body.author[0].name === 'New Org inc.' ||
        body.author[0].name === 'New Sample Author'
    )
    await tap.ok(
      body.author[1].name === 'New Org inc.' ||
        body.author[1].name === 'New Sample Author'
    )
    await tap.equal(body.editor[0].name, 'New Sample Editor')
    await tap.ok(attributions)
    await tap.ok(attributions[0] instanceof Attribution)
    await tap.equal(attributions.length, 3)
    await tap.ok(
      attributions[0].name === 'New Sample Author' ||
        attributions[0].name === 'New Org inc.' ||
        attributions[0].name === 'New Sample Editor'
    )
  })

  await tap.test('Update a Publication that does not exist', async () => {
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
            type: 'Publication',
            id: publicationUrl + 'abc',
            name: 'New name for pub A',
            // datePublished: timestamp,
            description: 'New description for Publication',
            json: { property: 'New value for json property' },
            inLanguage: ['Swahili', 'French'],
            keywords: ['newKeyWord1', 'newKeyWord2'],
            author: [
              { type: 'Person', name: 'New Sample Author' },
              { type: 'Organization', name: 'New Org inc.' }
            ],
            editor: [{ type: 'Person', name: 'New Sample Editor' }]
          }
        })
      )

    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(error.details.type, 'Publication')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Update Publication')
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
