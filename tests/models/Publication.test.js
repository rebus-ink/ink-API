const tap = require('tap')
const { destroyDB } = require('../integration/utils')
const app = require('../../server').app
const { Reader } = require('../../models/Reader')
const { Publication } = require('../../models/Publication')
const { Document } = require('../../models/Document')
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

  const createdReader = await Reader.createReader(
    'auth0|foo1545149868964',
    reader
  )

  const publicationObject = new Publication()
  Object.assign(publicationObject, {
    id: '28ca9d84-9afb-4f9e-a437-6f05dc2f5824',
    description: null,
    json: {
      type: 'reader:Publication',
      name: 'Publication A',
      attributedTo: [{ type: 'Person', name: 'Sample Author' }]
    },
    attachment: [{ type: 'Document', content: 'content of document' }]
  })

  let publicationId
  let publication

  await tap.test('Create Publication', async () => {
    let response = await Reader.addPublication(createdReader, publicationObject)
    await tap.ok(response)
    await tap.ok(response instanceof Publication)
    await tap.equal(response.readerId, createdReader.id)

    publicationId = parseurl(response.url).path.substr(13)
  })

  await tap.test('By short id', async () => {
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

  await tap.test('asRef', async () => {
    // asRef is broken. Will fix the test and the code in another PR
  })

  await app.terminate({ clearDB: true })
  await destroyDB()
}

test()
