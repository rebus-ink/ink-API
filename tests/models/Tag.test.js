const tap = require('tap')
const { destroyDB } = require('../integration/utils')
const { Reader } = require('../../models/Reader')
const { Tag } = require('../../models/Tag')
const parseurl = require('url').parse

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const reader = {
    name: 'J. Random Reader',
    userId: 'auth0|foo1545149868964'
  }

  const tagObject = {
    type: 'reader:Stack',
    name: 'mystack'
  }

  const createdReader = await Reader.createReader(
    'auth0|foo1545149868964',
    reader
  )

  await tap.test('Create Stack', async () => {
    let response = await Reader.addTag(createdReader, tagObject)
    await tap.ok(response)
    await tap.ok(response instanceof Tag)
    await tap.equal(response.readerId, createdReader.id)

    tagId = parseurl(response.url).path.substr(5)
  })

  await tap.test('get Tag by short id', async () => {
    tag = await Tag.byShortId(tagId)
    await tap.type(tag, 'object')
    await tap.ok(tag instanceof Tag)
    await tap.equal(tag.readerId, createdReader.id)
  })

  // tags probably don't need asRef

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
