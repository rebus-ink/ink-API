const tap = require('tap')
const { destroyDB } = require('../integration/utils')
const { Reader } = require('../../models/Reader')
const { Note } = require('../../models/Note')
const parseurl = require('url').parse
const short = require('short-uuid')
const translator = short()

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const reader = {
    name: 'J. Random Reader',
    userId: 'auth0|foo1545149868962'
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

  const noteObject = {
    type: 'Note',
    content: 'Sample Note content',
    'oa:hasSelector': {}
  }

  const createdReader = await Reader.createReader(
    'auth0|foo1545149868962',
    reader
  )

  let publication = await Reader.addPublication(
    createdReader,
    publicationObject
  )
  let publicationShortId = translator.fromUUID(publication.id)
  documentObject.context = `http://localhost:8080/publication-${publicationShortId}`
  let document = await Reader.addDocument(createdReader, documentObject)
  let documentShortId = translator.fromUUID(document.id)
  noteObject.inReplyTo = `http://localhost:8080/document-${documentShortId}`
  noteObject.context = `http://localhost:8080/publication-${publicationShortId}`

  let noteId
  let note
  let noteUrl

  await tap.test('Create Note', async () => {
    let response = await Reader.addNote(createdReader, noteObject)
    await tap.ok(response)
    await tap.ok(response instanceof Note)
    await tap.equal(response.readerId, createdReader.id)
    await tap.equal(
      response.json.inReplyTo,
      `http://localhost:8080/document-${documentShortId}`
    )

    noteId = parseurl(response.url).path.substr(6)
    noteUrl = response.url
  })

  await tap.test('Get note by short id', async () => {
    note = await Note.byShortId(noteId)
    await tap.type(note, 'object')
    await tap.equal(note.type, 'text/html')
    await tap.ok(note instanceof Note)
    // eager loading the reader
    await tap.type(note.reader, 'object')
    await tap.ok(note.reader instanceof Reader)
  })

  await tap.test('Note as Ref', async () => {
    const noteRef = note.asRef()
    await tap.ok(noteRef)
    await tap.type(noteRef, 'string')
  })

  await tap.test('Delete Note', async () => {
    const res = await Note.delete(noteId)
    await tap.ok(res.deleted)
  })

  await tap.test('Delete Note that does not exist', async () => {
    const res = await Note.delete('123')
    await tap.notOk(res)
  })

  await tap.test('Update Note', async () => {
    const res = await Note.update({ id: noteUrl, content: 'new content' })
    await tap.ok(res)
    await tap.equal(res.json.content, 'new content')
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
