const tap = require('tap')
const { destroyDB } = require('../utils/testUtils')
const { Reader } = require('../../models/Reader')
const { Source } = require('../../models/Source')
const { Attribution } = require('../../models/Attribution')
const { urlToId } = require('../../utils/utils')
const crypto = require('crypto')

const test = async app => {
  const reader = {
    name: 'J. Random Reader'
  }
  const random = crypto.randomBytes(13).toString('hex')

  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)

  const simpleSource = {
    type: 'Book',
    name: 'Source A',
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

  const source = await Source.createSource(createdReader, simpleSource)

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

  await tap.test('Create Attribution', async () => {
    let response = await Attribution.createAttribution(
      attributionObject,
      'author',
      source
    )
    await tap.ok(response)
    await tap.ok(response instanceof Attribution)
    await tap.equal(response.readerId, createdReader.id)
  })

  await tap.test('Create Attribution with string', async () => {
    let response = await Attribution.createAttribution(
      attributionString,
      'editor',
      source
    )
    await tap.ok(response)
    await tap.ok(response instanceof Attribution)
    await tap.equal(response.type, 'Person')
    await tap.equal(response.readerId, createdReader.id)
  })

  await tap.test('Try to create Attribution with invalid type', async () => {
    try {
      await Attribution.createAttribution(
        invalidAttributionObject,
        'author',
        source
      )
    } catch (err) {
      await tap.equal(
        err.message,
        `author attribution Validation Error: Robot is not a valid type. Must be 'Person' or 'Organization'`
      )
    }
  })

  await tap.test('Try to create Attribution without a name', async () => {
    try {
      await Attribution.createAttribution({ type: 'Person' }, 'author', source)
    } catch (err) {
      await tap.equal(
        err.message,
        `author attribution Validation Error: name is a required property`
      )
    }
  })

  await tap.test('Get all attributions by sourceId', async () => {
    await Attribution.createAttribution('Sonya Rabhi', 'editor', source)

    let attributions = await Attribution.getAttributionBySourceId(
      urlToId(source.id)
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
    'Delete attributions with a certain role of a given source',
    async () => {
      await Attribution.createAttribution('John Doe', 'author', source)

      await Attribution.createAttribution('Bugs Bunny', 'editor', source)

      let numDeleted = await Attribution.deleteAttributionOfSource(
        urlToId(source.id),
        'author'
      )

      let attributions = await Attribution.getAttributionBySourceId(
        urlToId(source.id)
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
