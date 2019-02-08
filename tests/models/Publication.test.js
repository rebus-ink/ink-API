const tap = require('tap')
const { destroyDB } = require('../integration/utils')
const { Reader } = require('../../models/Reader')
const { Publication } = require('../../models/Publication')
const { Publications_Tags } = require('../../models/Publications_Tags')
const { Document } = require('../../models/Document')
const parseurl = require('url').parse

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const reader = {
    name: 'J. Random Reader',
    userId: 'auth0|foo1545149868964'
  }

  const createdReader = await Reader.createReader(
    'auth0|foo1545149868964',
    reader
  )

  const createPublicationObj = {
    type: 'reader:Publication',
    name: 'Publication A',
    attributedTo: [{ type: 'Person', name: 'Sample Author' }],
    totalItems: 1,
    attachment: [{ type: 'Document', content: 'content of document' }]
  }

  const createdTag = await Reader.addTag(createdReader, {
    type: 'reader:Stack',
    name: 'mystack'
  })

  let publicationId
  let publication

  await tap.test('Create Publication', async () => {
    let response = await Reader.addPublication(
      createdReader,
      createPublicationObj
    )
    await tap.ok(response)
    await tap.ok(response instanceof Publication)
    await tap.equal(response.readerId, createdReader.id)

    publicationId = parseurl(response.url).path.substr(13)
  })

  await tap.test('Get publication by short id', async () => {
    publication = await Publication.byShortId(publicationId)
    await tap.type(publication, 'object')
    await tap.ok(publication instanceof Publication)
    await tap.equal(publication.readerId, createdReader.id)
    // eager: reader, attachment
    await tap.type(publication.reader, 'object')
    await tap.ok(publication.reader instanceof Reader)
    await tap.type(publication.attachment, 'object')
    await tap.ok(publication.attachment[0] instanceof Document)
  })

  await tap.test('Publication asRef', async () => {
    // asRef is broken. Will fix the test and the code in another PR
  })

  await tap.test('Publication addTag', async () => {
    const res = await Publications_Tags.addTagToPub(
      publication.url,
      createdTag.id
    )

    await tap.ok(res.publicationId)
    await tap.ok(res.tagId)
    await tap.equal(res.publicationId, publication.id)
    await tap.equal(res.tagId, createdTag.id)
  })

  await tap.test('Publication remove tag', async () => {
    const res = await Publications_Tags.removeTagFromPub(
      publication.url,
      createdTag.id
    )
    await tap.equal(res, 1)
  })

  await tap.test('Try to assign same tag twice', async () => {
    await Publications_Tags.addTagToPub(publication.url, createdTag.id)

    const res = await Publications_Tags.addTagToPub(
      publication.url,
      createdTag.id
    )

    await tap.equal(res.message, 'duplicate')
  })

  await tap.test('Delete publication', async () => {
    const res = await Publication.delete(publicationId)

    await tap.equal(res, 1)
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
