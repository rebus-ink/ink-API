const tap = require('tap')
const { destroyDB } = require('../integration/utils')
const { Reader } = require('../../models/Reader')
const { Document } = require('../../models/Document')
const parseurl = require('url').parse
const short = require('short-uuid')
const translator = short()

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const reader = {
    name: 'J. Random Reader',
    userId: 'auth0|foo1545149868963'
  }

  const documentObject = {
    type: 'Document',
    name: 'Chapter 1',
    content: 'Sample document content 1',
    position: 0
  }

  const publicationObject = {
    type: 'reader:Publication',
    name: 'Publication A',
    attributedTo: [{ type: 'Person', name: 'Sample Author' }],
    attachment: [{ type: 'Document', content: 'content of document' }]
  }

  const createdReader = await Reader.createReader(
    'auth0|foo1545149868963',
    reader
  )

  let publication = await Reader.addPublication(
    createdReader,
    publicationObject
  )

  let publicationShortId = translator.fromUUID(publication.id)
  documentObject.context = `http://localhost:8080/publication-${publicationShortId}`
  let documentId
  let document

  await tap.test('Create Document', async () => {
    let response = await Reader.addDocument(createdReader, documentObject)
    await tap.ok(response)
    await tap.ok(response instanceof Document)
    await tap.equal(response.readerId, createdReader.id)

    documentId = parseurl(response.url).path.substr(10)
  })

  await tap.test('Get document by short id', async () => {
    document = await Document.byShortId(documentId)
    await tap.type(document, 'object')
    await tap.equal(document.type, 'text/html')
    await tap.ok(document instanceof Document)
    // eager: reader
    await tap.type(document.reader, 'object')
    await tap.ok(document.reader instanceof Reader)
  })

  await tap.test('Document asRef', async () => {
    // make it clearer what asRef should keep and what it should remove
    const refDocument = document.asRef()
    await tap.ok(refDocument)
    await tap.equal(refDocument.type, 'Document')
    await tap.notOk(refDocument.attachment)
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
