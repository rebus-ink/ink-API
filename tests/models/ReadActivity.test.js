const tap = require('tap')
const { destroyDB } = require('../integration/utils')
const { Activity } = require('../../models/Activity')
const { ReadActivity } = require('../../models/ReadActivity')
const { Reader } = require('../../models/Reader')
const { Publication } = require('../../models/Publication')
const crypto = require('crypto')
const { urlToId } = require('../../routes/utils')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const reader = {
    name: 'J. Random Reader'
  }
  const random = crypto.randomBytes(13).toString('hex')

  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)

  const simplePublication = {
    type: 'reader:Publication',
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

  const publication = await Publication.createPublication(
    createdReader,
    simplePublication
  )

  const selectorJsonObject = {
    selector: { property: 'value' },
    json: { anotherProperty: 88 }
  }

  const selectorObject = {
    selector: { property: 'someValue' }
  }

  let id

  await tap.test('Create ReadActivity with selector and json', async () => {
    let readActivity = await ReadActivity.createReadActivity(
      createdReader.id,
      publication.id,
      selectorJsonObject
    )

    await tap.ok(readActivity)
    await tap.equal(readActivity.readerId, createdReader.id)
    await tap.equal(readActivity.publicationId, publication.id)
    /*
    await tap.type(response, 'object')
    await tap.ok(response.id.startsWith('http'))
    await tap.type(response.type, 'string')
    await tap.equal(response.type, 'Arrive')
    await tap.equal(response.readerId, createdReader.id)
    await tap.equal(response.json.property, 'value')
    await tap.equal(response.object.type, 'Document')
    await tap.equal(response.target.property, 'something')
    id = urlToId(response.id)
    */
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
