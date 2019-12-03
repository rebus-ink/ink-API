const tap = require('tap')
const { destroyDB } = require('../utils/utils')
const { Reader } = require('../../models/Reader')
const { Document } = require('../../models/Document')
const { Publication } = require('../../models/Publication')
const { urlToId } = require('../../utils/utils')
const crypto = require('crypto')

const test = async app => {
  const reader = {
    name: 'J. Random Reader'
  }

  const random = crypto.randomBytes(13).toString('hex')

  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)

  const simplePublication = {
    type: 'Publication',
    name: 'Publication A',
    readingOrder: [
      {
        type: 'Link',
        url: 'http://example.org/abc',
        name: 'An example link'
      },
      {
        type: 'Link',
        url: 'http://example.org/abc2',
        name: 'An example link2'
      }
    ]
  }

  const publication = await Publication.createPublication(
    createdReader,
    simplePublication
  )

  const documentObject = {
    mediaType: 'txt',
    url: 'http://google-bucket/somewhere/file1234.txt',
    documentPath: '/inside/the/book.txt',
    json: { property1: 'value1' }
  }

  let documentId

  await tap.test('Create Document', async () => {
    let response = await Document.createDocument(
      createdReader,
      publication.id,
      documentObject
    )
    await tap.ok(response)
    await tap.ok(response instanceof Document)
    await tap.equal(response.readerId, createdReader.id)

    documentId = response.id
  })

  await tap.test('Get document by id', async () => {
    document = await Document.byId(documentId)
    await tap.type(document, 'object')
    await tap.equal(document.mediaType, 'txt')
    await tap.ok(document instanceof Document)
    // eager: reader
    await tap.type(document.reader, 'object')
    await tap.ok(document.reader instanceof Reader)
  })

  await tap.test('Get redirect url', async () => {
    const url = await Document.getRedirectUrl(
      urlToId(publication.id),
      document.documentPath
    )

    await tap.type(url, 'string')
    await tap.equal(url, documentObject.url)
  })

  await tap.test('Delete all documents of a publication', async () => {
    // Add another document
    const newDocumentObject = {
      mediaType: 'txt',
      url: 'http://google-bucket/somewhere/file1234.txt',
      documentPath: '/inside/the/book.txt',
      json: { property2: 'value2' }
    }

    let newDoc = await Document.createDocument(
      createdReader,
      publication.id,
      newDocumentObject
    )

    const numDeleted = await Document.deleteDocumentsByPubId(
      urlToId(publication.id)
    )

    const docDeleted = await Document.byId(documentId)
    const doc2Deleted = await Document.byId(newDoc.id)

    await tap.equal(numDeleted, 2)
    await tap.ok(docDeleted.deleted)
    await tap.ok(doc2Deleted.deleted)
  })

  await tap.test(
    'Delete all documents of a publication with the wrong publicationId',
    async () => {
      const numDeleted = await Document.deleteDocumentsByPubId('wrongId123')

      await tap.equal(numDeleted, 0)
    }
  )

  await destroyDB(app)
}

module.exports = test
