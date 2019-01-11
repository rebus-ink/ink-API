const tap = require('tap')
const { destroyDB } = require('../integration/utils')
const app = require('../../server').app
const { Reader } = require('../../models/Reader')
const parseurl = require('url').parse

const test = async () => {
  await app.initialize()

  const reader = Object.assign(new Reader(), {
    id: '123456789abcdef',
    json: { name: 'J. Random Reader', userId: 'auth0|foo1545149868964' },
    userId: 'auth0|foo1545149868964',
    published: '2018-12-18T16:17:49.077Z',
    updated: '2018-12-18 16:17:49'
  })

  let readerShortId
  let createdReader
  let readerId = 'auth0|foo1545149868964'

  await tap.test('Create Reader', async () => {
    createdReader = await Reader.createReader(readerId, reader)

    await tap.ok(createdReader)
    await tap.ok(createdReader instanceof Reader)
    readerShortId = parseurl(createdReader.url).path.substr(8)
  })

  await tap.test('By short id', async () => {
    const responseReader = await Reader.byShortId(readerShortId)

    await tap.type(responseReader, 'object')
    await tap.ok(responseReader instanceof Reader)
    await tap.ok(responseReader.publications === undefined)
  })

  await tap.test('By short id with eager loading', async () => {
    const responseReader = await Reader.byShortId(readerShortId, [
      'publications'
    ])

    await tap.type(responseReader, 'object')
    await tap.ok(responseReader instanceof Reader)
  })

  await tap.test('By user id', async () => {
    const responseReader = await Reader.byUserId(readerId)

    await tap.type(responseReader, 'object')
    await tap.ok(responseReader instanceof Reader)
  })

  await tap.test('Check If Exists - returns true if exists', async () => {
    const response = await Reader.checkIfExists(readerId)

    await tap.equal(response, true)
  })

  await tap.test(
    'Check If Exists - returns false if does not exist',
    async () => {
      const response = await Reader.checkIfExists('auth0|123456789abc')

      await tap.equal(response, false)
    }
  )

  await tap.test('asRef', async () => {
    const refObject = createdReader.asRef()

    await tap.type(refObject, 'object')
    await tap.type(refObject.id, 'string')
    await tap.equal(refObject.type, 'Person')
    await tap.equal(refObject.userId, undefined)
  })

  await app.terminate()
  await destroyDB()
}

test()
