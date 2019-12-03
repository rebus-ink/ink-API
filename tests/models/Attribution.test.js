const tap = require('tap')
const { destroyDB } = require('../utils/utils')
const { Reader } = require('../../models/Reader')
const { Publication } = require('../../models/Publication')
const { Attribution } = require('../../models/Attribution')
const { urlToId } = require('../../utils/utils')
const crypto = require('crypto')

const test = async app => {
  const reader = {
    name: 'J. Random Reader'
  }
  const random = crypto.randomBytes(13).toString('hex')

  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)

  const simplePublication = {
    type: 'Book',
    name: 'Publication A',
    readingOrder: [
      {
        type: 'Link',
        url: 'http://example.org/abc',
        name: 'An example link'
      },
      {
        type: 'Link',
        url: 'http://example.org/abc2',
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

  await tap.test('Create Attribution with invalid type', async () => {
    try {
      await Attribution.createAttribution(
        invalidAttributionObject,
        'author',
        publication
      )
    } catch (err) {
      await tap.equal(err.message, 'invalid attribution type')
    }
  })

  await tap.test('Get attribution by Id', async () => {
    let response = await Attribution.byId(createdAttribution.id)

    await tap.ok(response)
    await tap.ok(response instanceof Attribution)
  })

  await tap.test('Get all attributions by publicationId', async () => {
    await Attribution.createAttribution('Sonya Rabhi', 'editor', publication)

    let attributions = await Attribution.getAttributionByPubId(
      urlToId(publication.id)
    )

    let isSonyaFound = false
    let isJaneFound = false
    for (let i = 0; i < attributions.length; i++) {
      if (attributions[i].name === 'Sonya Rabhi') {
        isSonyaFound = true
      } else if (attributions[i].name === 'Jane Doe') {
        isJaneFound = true
      }
    }

    await tap.ok(attributions)
    await tap.ok(attributions[0] instanceof Attribution)
    await tap.equal(attributions.length, 3)
    await tap.ok(isSonyaFound)
    await tap.ok(isJaneFound)
  })

  await tap.test(
    'Delete attributions with a certain role of a given publication',
    async () => {
      await Attribution.createAttribution('John Doe', 'author', publication)

      await Attribution.createAttribution('Bugs Bunny', 'editor', publication)

      let numDeleted = await Attribution.deleteAttributionOfPub(
        urlToId(publication.id),
        'author'
      )

      let attributions = await Attribution.getAttributionByPubId(
        urlToId(publication.id)
      )

      let isBunnyFound = false
      let isJohnFound = false
      for (let i = 0; i < attributions.length; i++) {
        if (attributions[i].name === 'Bugs Bunny') {
          isBunnyFound = true
        } else if (attributions[i].name === 'John Doe') {
          isJohnFound = true
        }
      }

      await tap.equal(numDeleted, 2)
      await tap.ok(isBunnyFound)
      await tap.ok(!isJohnFound)
    }
  )

  await destroyDB(app)
}

module.exports = test
