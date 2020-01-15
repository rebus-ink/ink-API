const tap = require('tap')
const { destroyDB } = require('../utils/testUtils')
const { Reader } = require('../../models/Reader')
const { Note } = require('../../models/Note')
const { Tag } = require('../../models/Tag')
const { Publication } = require('../../models/Publication')
const { Document } = require('../../models/Document')
const { Note_Tag } = require('../../models/Note_Tag')
const { urlToId } = require('../../utils/utils')
const crypto = require('crypto')
const { NoteBody } = require('../../models/NoteBody')
const { ValidationError } = require('objection')

const test = async app => {
  const reader = {
    name: 'J. Random Reader'
  }

  const random = crypto.randomBytes(13).toString('hex')

  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)
  const readerId = urlToId(createdReader.id)

  const note = await Note.createNote(createdReader, {
    stylesheet: { property: 'value' },
    target: { property2: 'value2' }
  })
  const noteId = urlToId(note.id)

  const noteBodySimple = {
    motivation: 'test'
  }

  const noteBody = {
    content: 'content of this note',
    language: 'en',
    motivation: 'test'
  }

  await tap.test('Create Simple NoteBody', async () => {
    let response = await NoteBody.createNoteBody(
      noteBodySimple,
      noteId,
      readerId
    )
    await tap.ok(response)
    await tap.ok(response instanceof NoteBody)
    await tap.equal(urlToId(response.readerId), readerId)
    await tap.equal(urlToId(response.noteId), noteId)
    await tap.equal(response.motivation, noteBodySimple.motivation)
    await tap.ok(response.id)
    await tap.ok(response.published)
  })

  await tap.test('Create NoteBody', async () => {
    let response = await NoteBody.createNoteBody(noteBody, noteId, readerId)
    await tap.ok(response)
    await tap.ok(response instanceof NoteBody)
    await tap.equal(urlToId(response.readerId), readerId)
    await tap.equal(urlToId(response.noteId), noteId)
    await tap.equal(response.motivation, noteBody.motivation)
    await tap.equal(response.language, noteBody.language)
    await tap.equal(response.content, noteBody.content)
    await tap.ok(response.id)
    await tap.ok(response.published)
  })

  await tap.test('Try to create NoteBody without a motivation', async () => {
    let err
    try {
      await NoteBody.createNoteBody({ content: 'something' }, noteId, readerId)
    } catch (e) {
      err = e
    }
    await tap.ok(err)
    await tap.ok(err instanceof ValidationError)
    await tap.equal(err.type, 'ModelValidation')
    await tap.ok(err.data.motivation)
    await tap.equal(err.data.motivation[0].message, 'is a required property')
  })

  await tap.test('Try to create NoteBody without a readerId', async () => {
    let err
    try {
      await NoteBody.createNoteBody({ motivation: 'test' }, noteId)
    } catch (e) {
      err = e
    }
    await tap.ok(err)
    await tap.equal(err.message, 'no readerId')
  })

  await tap.test('Try to create NoteBody without a noteId', async () => {
    let err
    try {
      await NoteBody.createNoteBody({ motivation: 'test' }, undefined, readerId)
    } catch (e) {
      err = e
    }
    await tap.ok(err)
    await tap.equal(err.message, 'no noteId')
  })

  await tap.test('Try to create NoteBody without a body', async () => {
    let err
    try {
      await NoteBody.createNoteBody(undefined, noteId, readerId)
    } catch (e) {
      err = e
    }
    await tap.ok(err)
    await tap.equal(err.message, 'no noteBody')
  })

  await tap.test('Delete Bodies of Note', async () => {
    const res = await NoteBody.deleteBodiesOfNote(noteId)

    await tap.equal(res, 2)

    // trying again with same note, should return 0
    const res2 = await NoteBody.deleteBodiesOfNote(noteId)

    await tap.equal(res2, 0)
  })

  await destroyDB(app)
}

module.exports = test
