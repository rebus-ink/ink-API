const tap = require('tap')
const { destroyDB } = require('../integration/utils')
const { Reader } = require('../../models/Reader')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const reader = {
    name: 'J. Random Reader',
    authId: 'auth0|foo1545149868965'
  }

  let createdReader

  await tap.test('Create Reader', async () => {
    createdReader = await Reader.createReader(reader.authId, reader)

    await tap.ok(createdReader)
    await tap.ok(createdReader instanceof Reader)
  })

  await tap.test('Get reader by id', async () => {
    const responseReader = await Reader.byId(createdReader.id)

    await tap.type(responseReader, 'object')
    await tap.ok(responseReader instanceof Reader)
    await tap.ok(responseReader.publications === undefined)
  })

  await tap.test('Get reader by id with eager loading', async () => {
    const responseReader = await Reader.byId(createdReader.id, '[publications]')

    await tap.type(responseReader, 'object')
    await tap.ok(responseReader instanceof Reader)
    await tap.ok(Array.isArray(responseReader.publications))
  })

  await tap.test('Get reader by auth id', async () => {
    const responseReader = await Reader.byAuthId(reader.authId)

    await tap.type(responseReader, 'object')
    await tap.ok(responseReader instanceof Reader)
  })

  await tap.test(
    'Check If Reader Exists - returns true if exists',
    async () => {
      const response = await Reader.checkIfExistsByAuthId(reader.authId)

      await tap.equal(response, true)
    }
  )

  await tap.test(
    'Check If Exists - returns false if does not exist',
    async () => {
      const response = await Reader.checkIfExistsByAuthId('auth0|123456789abc')

      await tap.equal(response, false)
    }
  )

  await tap.test('Reader asRef', async () => {
    const refObject = createdReader.asRef()

    await tap.type(refObject, 'object')
    await tap.type(refObject.id, 'string')
    await tap.equal(refObject.type, 'Person')
    await tap.equal(refObject.authId, undefined)
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
