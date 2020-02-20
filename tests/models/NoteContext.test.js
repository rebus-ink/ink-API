const tap = require('tap')
const { destroyDB } = require('../utils/testUtils')
const { Reader } = require('../../models/Reader')
const { urlToId } = require('../../utils/utils')
const crypto = require('crypto')
const { NoteContext } = require('../../models/NoteContext')
const { ValidationError } = require('objection')

const test = async app => {
  const reader = {
    name: 'J. Random Reader'
  }
  const random = crypto.randomBytes(13).toString('hex')
  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)
  const readerId = urlToId(createdReader.id)
  let noteContextId

  await tap.test('Create NoteContext shouldn not throw an error', async () => {
    let error
    try {
      let noteContext = await NoteContext.createNoteContext(
        {
          type: 'test',
          name: 'something',
          description: 'a description goes here'
        },
        readerId
      )
      noteContextId = noteContext.id
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test('Create NoteContext with only a type', async () => {
    let error
    try {
      await NoteContext.createNoteContext(
        {
          type: 'test'
        },
        readerId
      )
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test('Update a NoteContext', async () => {
    let error
    try {
      await NoteContext.update({ id: noteContextId, type: 'test2' })
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test('Delete a NoteContext', async () => {
    let error
    try {
      await NoteContext.delete(noteContextId)
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test('Try to Create NoteContext without a type', async () => {
    let error
    try {
      await NoteContext.createNoteContext(
        {
          name: 'something',
          description: 'a description goes here'
        },
        readerId
      )
    } catch (err) {
      error = err
    }
    await tap.ok(error)
    await tap.ok(error instanceof ValidationError)
  })

  await destroyDB(app)
}

module.exports = test
