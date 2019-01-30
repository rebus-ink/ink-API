const tap = require('tap')
const { destroyDB } = require('../integration/utils')
const { Reader } = require('../../models/Reader')
const parseurl = require('url').parse

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const reader = {
    name: 'J. Random Reader',
    userId: 'auth0|foo1545149868964',
    published: '2018-12-18T16:17:49.077Z',
    updated: '2018-12-18 16:17:49'
  }

  let readerShortId
  let createdReader
  let readerId = 'auth0|foo1545149868964'

  await tap.test('Create Reader', async () => {
    createdReader = await Reader.createReader(readerId, reader)

    await tap.ok(createdReader)
    await tap.ok(createdReader instanceof Reader)
    readerShortId = parseurl(createdReader.url).path.substr(8)
  })

  await tap.test('Get reader by short id', async () => {
    const responseReader = await Reader.byShortId(readerShortId)

    await tap.type(responseReader, 'object')
    await tap.ok(responseReader instanceof Reader)
    await tap.ok(responseReader.publications === undefined)
  })

  await tap.test('Get reader by short id with eager loading', async () => {
    const responseReader = await Reader.byShortId(
      readerShortId,
      '[publications]'
    )

    await tap.type(responseReader, 'object')
    await tap.ok(responseReader instanceof Reader)
  })

  await tap.test('Get reader by user id', async () => {
    const responseReader = await Reader.byUserId(readerId)

    await tap.type(responseReader, 'object')
    await tap.ok(responseReader instanceof Reader)
  })

  await tap.test(
    'Check If Reader Exists - returns true if exists',
    async () => {
      const response = await Reader.checkIfExists(readerId)

      await tap.equal(response, true)
    }
  )

  await tap.test(
    'Check If Exists - returns false if does not exist',
    async () => {
      const response = await Reader.checkIfExists('auth0|123456789abc')

      await tap.equal(response, false)
    }
  )

  await tap.test('Reader asRef', async () => {
    const refObject = createdReader.asRef()

    await tap.type(refObject, 'object')
    await tap.type(refObject.id, 'string')
    await tap.equal(refObject.type, 'Person')
    await tap.equal(refObject.userId, undefined)
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
