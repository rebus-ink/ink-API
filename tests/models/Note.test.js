const tap = require('tap')
const { destroyDB } = require('../integration/utils')
const { Reader } = require('../../models/Reader')
const { Document } = require('../../models/Document')
const { Publication } = require('../../models/Publication')
const { Note } = require('../../models/Note')
const parseurl = require('url').parse

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const reader = Object.assign(new Reader(), {
    id: '123456789abcdef',
    json: { name: 'J. Random Reader', userId: 'auth0|foo1545149868964' },
    userId: 'auth0|foo1545149868964',
    published: '2018-12-18T16:17:49.077Z',
    updated: '2018-12-18 16:17:49'
  })

  const documentObject = Object.assign(new Document(), {
    id: 'd66ffff8-06ad-4d72-88a2-4fddfb123a12',
    type: 'text/html',
    json: {
      type: 'Document',
      name: 'Chapter 1',
      content: 'Sample document content 1',
      position: 0
    },
    published: '2018-12-18T15:54:12.106Z',
    updated: '2018-12-18 15:54:12',
    reader: {
      id: '36dee441-3bf0-4e24-9d36-87bf01b27e89',
      json: { name: 'J. Random Reader', userId: 'auth0|foo1545148451777' },
      userId: 'auth0|foo1545148451777',
      published: '2018-12-18T15:54:11.865Z',
      updated: '2018-12-18 15:54:11'
    }
  })

  const publicationObject = new Publication()
  Object.assign(publicationObject, {
    description: null,
    json: {
      type: 'reader:Publication',
      name: 'Publication A',
      attributedTo: [{ type: 'Person', name: 'Sample Author' }]
    },
    attachment: [{ type: 'Document', content: 'content of document' }]
  })

  const noteObject = Object.assign(new Note(), {
    id: 'd66ffff8-06ad-4d72-88a2-4fddfb123a12',
    type: 'text/html',
    json: {
      type: 'Note',
      content: 'Sample Note content',
      'oa:hasSelector': {},
      context: 'http://localhost:8080/publication-abc123',
      inReplyTo: 'http://localhost:8080/document-abc123'
    },
    readerId: '36dee441-3bf0-4e24-9d36-87bf01b27e89',
    published: '2018-12-18T15:54:12.106Z',
    updated: '2018-12-18 15:54:12'
  })

  const createdReader = await Reader.createReader(
    'auth0|foo1545149868964',
    reader
  )

  let publication = await Reader.addPublication(
    createdReader,
    publicationObject
  )
  documentObject.publicationId = publication.id

  let document = await Reader.addDocument(createdReader, documentObject)
  noteObject.json.inReplyTo = document.id
  noteObject.json.context = publication.id

  let noteId

  await tap.test('Create Note', async () => {
    let response = await Reader.addNote(createdReader, noteObject)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    await tap.equal(response.readerId, createdReader.id)
    await tap.equal(response.json.inReplyTo, document.id)

    noteId = parseurl(response.url).path.substr(6)
  })

  await tap.test('Get note by short id', async () => {
    const note = await Note.byShortId(noteId)
    await tap.type(note, 'object')
    await tap.equal(note.type, 'text/html')
    await tap.ok(note instanceof Note)
    // does the note need to eager load anything?
  })

  // I don't think we need an asRef for notes.

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
