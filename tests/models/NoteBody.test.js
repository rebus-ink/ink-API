const tap = require('tap')
const { destroyDB } = require('../utils/testUtils')
const { Reader } = require('../../models/Reader')
const { Note } = require('../../models/Note')
const { urlToId } = require('../../utils/utils')
const crypto = require('crypto')
const { NoteBody } = require('../../models/NoteBody')

const test = async app => {
  const reader = {
    name: 'J. Random Reader'
  }

  const random = crypto.randomBytes(13).toString('hex')

  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)
  const readerId = urlToId(createdReader.id)

  const note = await Note.createNote(createdReader, {
    stylesheet: { property: 'value' },
    target: { property2: 'value2' },
    body: { motivation: 'test' } // not ideal since I am trying to test the noteBody creation by itself, but I can't create a note without it.
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
    let error
    try {
      await NoteBody.createNoteBody(noteBodySimple, noteId, readerId)
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test('Create NoteBody', async () => {
    let error
    try {
      await NoteBody.createNoteBody(noteBody, noteId, readerId)
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test('Create MultipleNoteBody', async () => {
    let error
    try {
      await NoteBody.createMultipleNoteBodies(
        [noteBody, noteBodySimple],
        noteId,
        readerId
      )
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test('Try to create NoteBody without a motivation', async () => {
    let err
    try {
      await NoteBody.createNoteBody({ content: 'something' }, noteId, readerId)
    } catch (e) {
      err = e
    }
    await tap.ok(err)
    await tap.ok(err instanceof Error)
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

    await tap.equal(res, 5)

    // trying again with same note, should return 0
    const res2 = await NoteBody.deleteBodiesOfNote(noteId)

    await tap.equal(res2, 0)
  })

  await destroyDB(app)
}

module.exports = test
