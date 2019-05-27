const tap = require('tap')
const { destroyDB } = require('../utils/utils')
const { Reader } = require('../../models/Reader')
const { Tag } = require('../../models/Tag')
const crypto = require('crypto')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }
  const random = crypto.randomBytes(13).toString('hex')

  const reader = {
    name: 'J. Random Reader'
  }

  const tagObject = {
    type: 'reader:Stack',
    name: 'mystack',
    json: { property: 1 }
  }

  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)

  await tap.test('Create Stack', async () => {
    let response = await Tag.createTag(createdReader.id, tagObject)

    await tap.ok(response)
    await tap.ok(response instanceof Tag)
    await tap.equal(response.readerId, createdReader.id)
    await tap.equal(response.type, 'reader:Stack')
    await tap.equal(response.name, 'mystack')
    await tap.type(response.id, 'string')
    await tap.type(response.json, 'object')
    await tap.equal(response.json.property, 1)
    await tap.ok(response.published)
    tagId = response.id
  })

  await tap.test('Get tag by id', async () => {
    let response = await Tag.byId(tagId)
    await tap.ok(response)
    await tap.ok(response instanceof Tag)
  })

  await tap.test('Delete tag by id', async () => {
    const newTagObject = {
      type: 'reader:Stack',
      name: 'random stack name',
      json: { property: 1 }
    }

    const tagCreated = await Tag.createTag(createdReader.id, newTagObject)

    const numDeleted = await Tag.deleteTag(tagCreated.id)

    // Try to fetch the deleted tag from library
    const tagDeleted = await Tag.byId(tagCreated.id)

    await tap.equal(numDeleted, 1)
    await tap.ok(!tagDeleted)
  })

  await tap.test('Delete tag with an id that does not exist', async () => {
    const newTagObject = {
      type: 'reader:Stack',
      name: 'random stack name',
      json: { property: 1 }
    }

    const tagCreated = await Tag.createTag(createdReader.id, newTagObject)

    const numDeleted = await Tag.deleteTag(tagCreated.id + 'randomString')

    await tap.equal(numDeleted, 0)
  })

  await tap.test('Delete tag with an invalid id', async () => {
    const newTagObject = {
      type: 'reader:Stack',
      name: 'another random stack name',
      json: { property: 1 }
    }

    await Tag.createTag(createdReader.id, newTagObject)

    const response = await Tag.deleteTag(null)

    await tap.ok(typeof response, Error)
    await tap.ok(response.message, 'no tag')
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
