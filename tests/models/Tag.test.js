const tap = require('tap')
const { destroyDB } = require('../integration/utils')
const { Reader } = require('../../models/Reader')
const { Tag } = require('../../models/Tag')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const reader = {
    name: 'J. Random Reader',
    userId: 'auth0|foo1545149868966'
  }

  const tagObject = {
    type: 'reader:Stack',
    name: 'mystack'
  }

  const createdReader = await Reader.createReader(
    'auth0|foo1545149868966',
    reader
  )

  await tap.test('Create Stack', async () => {
    let response = await Tag.createTag(createdReader.id, tagObject)
    await tap.ok(response)
    await tap.ok(response instanceof Tag)
    await tap.equal(response.readerId, createdReader.id)
    tagId = response.id
  })

  // tags probably don't need asRef

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
