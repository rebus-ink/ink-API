const tap = require('tap')
const { destroyDB } = require('../utils/testUtils')
const { Reader } = require('../../models/Reader')
const crypto = require('crypto')
const { urlToId } = require('../../utils/utils')

const test = async app => {
  const random1 = crypto.randomBytes(13).toString('hex')
  const random2 = crypto.randomBytes(13).toString('hex')
  const random3 = crypto.randomBytes(13).toString('hex')

  const reader = {
    name: 'J. Random Reader'
  }
  const authId = `auth0|foo${random1}`

  const reader2 = {
    name: 'J. Random Reader',
    json: {
      property1: 'value',
      property2: 4
    },
    profile: {
      age: 99
    },
    preferences: {
      favoriteColor: 'rainbow'
    },
    extraProperty: 'this should not be saved'
  }
  const authId2 = `auth0|foo${random2}`

  const reader3 = {
    name: 'J. Random Reader',
    json: {
      property1: 'value',
      property2: 4
    },
    preferences: {
      favoriteColor: 'rainbow'
    },
    username: 'user123',
    profilePicture: '/pictures/user123.jpg',
    role: 'admin',
    status: 'inactive',
    extraProperty: 'this should not be saved'
  }
  const authId3 = `auth0|foo${random3}`

  let createdReader, createdReader2, createdReader3

  await tap.test('Create Reader', async () => {
    createdReader = await Reader.createReader(authId, reader)

    await tap.ok(createdReader)
    await tap.ok(createdReader instanceof Reader)
    await tap.type(createdReader.id, 'string')
    await tap.type(createdReader.name, 'string')
    await tap.equal(createdReader.status, 'active') // default value
    await tap.equal(createdReader.role, 'reader') // default value
    await tap.ok(createdReader.published)
    await tap.ok(createdReader.updated)
  })

  await tap.test('Create Reader with additional properties', async () => {
    createdReader2 = await Reader.createReader(authId2, reader2)

    await tap.ok(createdReader2)
    await tap.ok(createdReader2 instanceof Reader)
    await tap.equal(createdReader2.profile.age, 99)
    await tap.equal(createdReader2.json.property2, 4)
    await tap.equal(createdReader2.preferences.favoriteColor, 'rainbow')
    await tap.equal(createdReader2.extraProperty, undefined)
  })

  await tap.test('Create Reader with new properties', async () => {
    createdReader3 = await Reader.createReader(authId3, reader3)

    await tap.ok(createdReader3)
    await tap.ok(createdReader3 instanceof Reader)
    await tap.equal(createdReader3.json.property2, 4)
    await tap.equal(createdReader3.preferences.favoriteColor, 'rainbow')
    await tap.equal(createdReader3.username, 'user123')
    await tap.equal(createdReader3.profilePicture, '/pictures/user123.jpg')
    await tap.equal(createdReader3.role, 'admin')
    await tap.equal(createdReader3.status, 'inactive')
    await tap.equal(createdReader3.extraProperty, undefined)
  })

  await tap.test('Get reader by id', async () => {
    const responseReader = await Reader.byId(urlToId(createdReader.id))

    await tap.type(responseReader, 'object')
    await tap.ok(responseReader instanceof Reader)
    await tap.equal(responseReader.name, 'J. Random Reader')
    await tap.ok(responseReader.sources === undefined)
  })

  await tap.test('Get reader by id with eager loading', async () => {
    const responseReader = await Reader.byId(
      urlToId(createdReader.id),
      '[sources]'
    )

    await tap.type(responseReader, 'object')
    await tap.ok(responseReader instanceof Reader)
    await tap.ok(Array.isArray(responseReader.sources))
  })

  await tap.test('Get reader by auth id', async () => {
    const responseReader = await Reader.byAuthId(authId)

    await tap.type(responseReader, 'object')
    await tap.ok(responseReader instanceof Reader)
    await tap.equal(responseReader.name, 'J. Random Reader')
  })

  await tap.test(
    'Check If Reader Exists - returns true if exists',
    async () => {
      const response = await Reader.checkIfExistsByAuthId(authId)

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

  let updatedTimestamp
  await tap.test('update Reader name', async () => {
    const updatedReader = await Reader.update(
      createdReader.id,
      Object.assign(createdReader, { name: 'Joe' })
    )
    await tap.equal(updatedReader.name, 'Joe')
    await tap.notOk(updatedReader.preferences)
    await tap.notOk(updatedReader.profile)
    await tap.notOk(updatedReader.json)
    await tap.not(updatedReader.published, updatedReader.updated)
    updatedTimestamp = updatedReader.updated
  })

  await tap.test('update Reader profilePicture', async () => {
    const updatedReader = await Reader.update(
      createdReader.id,
      Object.assign(createdReader, { profilePicture: '/pictures/Joe.jpg' })
    )
    await tap.equal(updatedReader.name, 'Joe')
    await tap.equal(updatedReader.profilePicture, '/pictures/Joe.jpg')
    await tap.notOk(updatedReader.preferences)
    await tap.notOk(updatedReader.profile)
    await tap.notOk(updatedReader.json)
    await tap.not(updatedReader.published, updatedReader.updated)
    updatedTimestamp = updatedReader.updated
  })

  await tap.test('update Reader profile', async () => {
    const updatedReader = await Reader.update(
      createdReader.id,
      Object.assign(createdReader, { profile: { favoriteColor: 'black' } })
    )
    await tap.equal(updatedReader.name, 'Joe')
    await tap.equal(updatedReader.profile.favoriteColor, 'black')
    await tap.notOk(updatedReader.preferences)
    await tap.notOk(updatedReader.json)
    await tap.not(updatedReader.published, updatedReader.updated)
    await tap.not(updatedReader.updated, updatedTimestamp)
  })

  await tap.test('update Reader profile to null', async () => {
    const updatedReader = await Reader.update(
      createdReader.id,
      Object.assign(createdReader, { profile: null })
    )
    await tap.equal(updatedReader.name, 'Joe')
    await tap.notOk(updatedReader.profile)
    await tap.notOk(updatedReader.preferences)
    await tap.notOk(updatedReader.json)
    await tap.not(updatedReader.published, updatedReader.updated)
    await tap.not(updatedReader.updated, updatedTimestamp)
  })

  await tap.test('soft delete reader', async () => {
    const deletedReader = await Reader.softDelete(createdReader.id)
    await tap.ok(deletedReader.deleted)
    await tap.equal(deletedReader.status, 'deleted')
  })

  await tap.test('update Reader with validation error', async () => {
    let error
    try {
      await Reader.update(
        createdReader.authId,
        Object.assign(createdReader, { profile: 123 })
      )
    } catch (err) {
      error = err
    }
    await tap.ok(error)
  })

  await destroyDB(app)
}

module.exports = test
