const tap = require('tap')
const { destroyDB } = require('../utils/testUtils')
const { Reader } = require('../../models/Reader')
const crypto = require('crypto')
const { urlToId } = require('../../utils/utils')
const { Notebook } = require('../../models/Notebook')
const { Note } = require('../../models/Note')
const { Notebook_Note } = require('../../models/Notebook_Note')

const test = async app => {
  const random = crypto.randomBytes(13).toString('hex')

  const reader = {
    name: 'J. Random Reader'
  }
  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)

  const noteObject = {
    body: { motivation: 'test', content: 'something' }
  }
  const note = await Note.createNote(createdReader, noteObject)
  const noteId = urlToId(note.id)

  let simpleNotebook = {
    name: 'notebook1',
    status: 'active'
  }

  const notebook = await Notebook.createNotebook(
    simpleNotebook,
    createdReader.id
  )
  const notebookId = urlToId(notebook.id)

  await tap.test('Add Note to Notebook', async () => {
    let error
    try {
      await Notebook_Note.addNoteToNotebook(notebookId, noteId)
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test('Try to Add invalid Note to Notebook', async () => {
    let error
    try {
      await Notebook_Note.addNoteToNotebook(notebookId, noteId + 'abc')
    } catch (err) {
      error = err
    }
    await tap.ok(error)
    await tap.equal(error.message, 'no note')
  })

  await tap.test('Try to add a Note to an invalid Notebook', async () => {
    let error
    try {
      await Notebook_Note.addNoteToNotebook(notebookId + 'abc', noteId)
    } catch (err) {
      error = err
    }
    await tap.ok(error)
    await tap.equal(error.message, 'no notebook')
  })

  await tap.test(
    'Try to add a Note to a Notebook when the relation already exists',
    async () => {
      let error
      try {
        await Notebook_Note.addNoteToNotebook(notebookId, noteId)
      } catch (err) {
        error = err
      }
      await tap.ok(error)
      await tap.equal(
        error.message,
        `Add Note to Notebook Error: Relationship already exists between Notebook ${notebookId} and Note ${noteId}`
      )
    }
  )

  await tap.test('Remove Note from Notebook', async () => {
    let error
    try {
      await Notebook_Note.removeNoteFromNotebook(notebookId, noteId)
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test(
    'Try to Remove Note from Notebook when relation does not exist',
    async () => {
      let error
      try {
        await Notebook_Note.removeNoteFromNotebook(notebookId, noteId)
      } catch (err) {
        error = err
      }
      await tap.ok(error)
      await tap.equal(
        error.message,
        `Remove Note from Notebook Error: No Relation found between Notebook ${notebookId} and Note ${noteId}`
      )
    }
  )

  await destroyDB(app)
}

module.exports = test
