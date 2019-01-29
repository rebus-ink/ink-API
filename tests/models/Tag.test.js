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

  const publicationObject = {
    type: 'reader:Publication',
    name: 'Publication A',
    attributedTo: [{ type: 'Person', name: 'Sample Author' }],
    attachment: [{ type: 'Document', content: 'content of document' }]
  }

  const tagObject = {
    type: 'reader:Stack',
    name: 'mystack'
  }

  const createdReader = await Reader.createReader(
    'auth0|foo1545149868964',
    reader
  )

  let publication = await Reader.addPublication(
    createdReader,
    publicationObject
  )

  await tap.test('Create Stack', async () => {
    let response = await Reader.addTag(createdReader, tagObject)
    await tap.ok(response)
    await tap.ok(response instanceof Tag)
    await tap.equal(response.readerId, createdReader.id)
  })

  // tags probably don't need a byShortId or asRef

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
