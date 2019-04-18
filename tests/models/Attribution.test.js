const tap = require('tap')
const { destroyDB } = require('../integration/utils')
const { Reader } = require('../../models/Reader')
const { Publication } = require('../../models/Publication')
const { Attribution } = require('../../models/Attribution')
const { Publications_Tags } = require('../../models/Publications_Tags')
const { Document } = require('../../models/Document')
const { urlToShortId } = require('../../routes/utils')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const reader = {
    name: 'J. Random Reader'
  }

  const createdReader = await Reader.createReader(
    'auth0|foo1545149538931',
    reader
  )

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

  const attributionObject = {
    name: 'Seymour Butts',
    type: 'Person',
    isContributor: true
  }

  const attributionString = 'Jane Doe'

  const invalidAttributionObject = {
    name: 'Seymour Butts',
    type: 'Robot'
  }

  let createdAttribution

  await tap.test('Create Attribution', async () => {
    let response = await Attribution.createAttribution(
      attributionObject,
      'author',
      publication
    )
    await tap.ok(response)
    await tap.ok(response instanceof Attribution)
    await tap.equal(response.readerId, createdReader.id)
    createdAttribution = response
  })

  await tap.test('Create Attribution with string', async () => {
    let response = await Attribution.createAttribution(
      attributionString,
      'editor',
      publication
    )
    await tap.ok(response)
    await tap.ok(response instanceof Attribution)
    await tap.equal(response.type, 'Person')
    await tap.equal(response.readerId, createdReader.id)
  })

  await tap.test('Create Attribution with invalid role', async () => {
    try {
      await Attribution.createAttribution(
        attributionObject,
        'authooor',
        publication
      )
    } catch (err) {
      await tap.equal(err.message, 'authooor is not a valid attribution role')
    }
  })

  await tap.test('Create Attribution with invalid type', async () => {
    try {
      await Attribution.createAttribution(
        invalidAttributionObject,
        'author',
        publication
      )
    } catch (err) {
      await tap.equal(
        err.message,
        "Robot is not a valid attribution type. Only 'Person' and 'Organization' are accepted."
      )
    }
  })

  await tap.test('Get attribution by Id', async () => {
    let response = await Attribution.byId(createdAttribution.id)

    await tap.ok(response)
    await tap.ok(response instanceof Attribution)
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  // await destroyDB(app)
}

module.exports = test
