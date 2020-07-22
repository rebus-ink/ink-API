const tap = require('tap')
const { destroyDB } = require('../utils/testUtils')
const { ReadActivity } = require('../../models/ReadActivity')
const { Reader } = require('../../models/Reader')
const { Source } = require('../../models/Source')
const crypto = require('crypto')
const { urlToId } = require('../../utils/utils')

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
        encodingFormat: 'text/html',
        name: 'An example link'
      },
      {
        type: 'Link',
        url: 'http://example.org/abc2',
        encodingFormat: 'text/html',
        name: 'An example link2'
      }
    ]
  }

  const source = await Source.createSource(createdReader, simpleSource)

  const selectorJsonObject = {
    selector: { property: 'value' },
    json: { anotherProperty: 88 }
  }

  const selectorObject = {
    selector: { property: 'someValue' }
  }

  await tap.test('Create ReadActivity with selector and json', async () => {
    let readActivity = await ReadActivity.createReadActivity(
      createdReader.id,
      source.id,
      selectorJsonObject
    )

    let lastReadActivity = await ReadActivity.query().findById(
      urlToId(readActivity.id)
    )

    await tap.ok(readActivity)
    await tap.equal(readActivity.id, lastReadActivity.id)
    await tap.equal(readActivity.readerId, createdReader.id)
    await tap.equal(readActivity.sourceId, source.id)
    await tap.equal(readActivity.selector.property, 'value')
    await tap.equal(readActivity.json.anotherProperty, 88)
  })

  await tap.test('Create ReadActivity with selector only', async () => {
    let readActivity = await ReadActivity.createReadActivity(
      urlToId(createdReader.id),
      urlToId(source.id),
      selectorObject
    )

    await tap.ok(readActivity)
    await tap.equal(readActivity.readerId, createdReader.id)
    await tap.equal(readActivity.sourceId, source.id)
    await tap.equal(readActivity.selector.property, 'someValue')
    await tap.equal(readActivity.json, null)
  })

  await tap.test('Create ReadActivity with non-existent sourceId', async () => {
    try {
      await ReadActivity.createReadActivity(
        urlToId(createdReader.id),
        urlToId(source.id + 'AnotherRandomString'),
        selectorObject
      )
    } catch (err) {
      await tap.equal(err.message, 'no source')
    }
  })

  await tap.test('Get latests ReadActivity of a source', async () => {
    const newReader = {
      name: 'Latest Reader'
    }
    const random1 = crypto.randomBytes(13).toString('hex')
    const latestReader = await Reader.createReader(
      `auth0|foo${random1}`,
      newReader
    )

    await ReadActivity.createReadActivity(
      urlToId(latestReader.id),
      urlToId(source.id),
      selectorObject
    )

    const lastReadActivity = await ReadActivity.createReadActivity(
      urlToId(latestReader.id),
      urlToId(source.id),
      selectorJsonObject
    )

    let readActivity = await ReadActivity.getLatestReadActivity(
      urlToId(source.id)
    )

    await tap.ok(readActivity)
    await tap.ok(readActivity instanceof ReadActivity)
    await tap.equal(readActivity.id, lastReadActivity.id)
    await tap.equal(readActivity.readerId, latestReader.id)
  })

  await tap.test(
    'Get latests ReadActivity with an invalid sourceId',
    async () => {
      let readActivity = await ReadActivity.getLatestReadActivity(null)

      await tap.ok(typeof readActivity, Error)
    }
  )

  await tap.test('Get latests ReadActivities of a reader', async () => {
    const lastReadActivity = await ReadActivity.createReadActivity(
      urlToId(createdReader.id),
      urlToId(source.id),
      selectorJsonObject
    )

    let readActivities = await ReadActivity.getLatestReadActivitiesForReader(
      urlToId(createdReader.id),
      2
    )

    await tap.ok(readActivities)
    await tap.equal(readActivities.length, 2)
    await tap.ok(readActivities[0] instanceof ReadActivity)
    await tap.equal(readActivities[0].id, lastReadActivity.id)
    await tap.ok(readActivities[0].source)
    await tap.equal(readActivities[0].readerId, createdReader.id)
  })

  await destroyDB(app)
}

module.exports = test
