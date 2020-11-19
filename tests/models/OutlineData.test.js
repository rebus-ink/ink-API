const tap = require('tap')
const { destroyDB } = require('../utils/testUtils')
const { Reader } = require('../../models/Reader')
const { Note } = require('../../models/Note')
const { urlToId } = require('../../utils/utils')
const crypto = require('crypto')
const { NoteBody } = require('../../models/NoteBody')
const { OutlineData } = require('../../models/OutlineData')

const test = async app => {
  const reader = {
    name: 'J. Random Reader'
  }

  const random = crypto.randomBytes(13).toString('hex')

  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)
  const readerId = urlToId(createdReader.id)

  const note1 = await Note.createNote(createdReader, {
    stylesheet: { property: 'value' },
    target: { property2: 'value2' },
    body: { motivation: 'test' }
  })
  const noteId1 = urlToId(note1.id)

  const note2 = await Note.createNote(createdReader, {
    body: { motivation: 'test' }
  })
  const noteId2 = urlToId(note2.id)

  const note3 = await Note.createNote(createdReader, {
    body: { motivation: 'test' }
  })
  const noteId3 = urlToId(note3.id)

  const note4 = await Note.createNote(createdReader, {
    body: { motivation: 'test' }
  })
  const noteId4 = urlToId(note4.id)

  const note5 = await Note.createNote(createdReader, {
    body: { motivation: 'test' }
  })
  const noteId5 = urlToId(note5.id)

  await tap.test('Create Outline Data', async () => {
    let error
    try {
      await OutlineData.create(readerId, {
        noteId: noteId1,
        previous: noteId2,
        next: noteId3,
        parentId: noteId4
      })
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test('Create Simple Outline Data', async () => {
    let error
    try {
      await OutlineData.create(readerId, { noteId: noteId2 })
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test('Try to create outline data without a noteId', async () => {
    let err
    try {
      await OutlineData.create(readerId, { previous: noteId1 })
    } catch (e) {
      err = e
    }
    await tap.ok(err)
    await tap.ok(err instanceof Error)
  })

  await tap.test('Try to create Outline Data without a readerId', async () => {
    let err
    try {
      await OutlineData.create(undefined, { noteId: noteId3 })
    } catch (e) {
      err = e
    }
    await tap.ok(err)
    await tap.equal(err.message, 'no readerId')
  })

  await tap.test(
    'Try to create Outline Data for a note that already has one',
    async () => {
      let err
      try {
        await OutlineData.create(readerId, { noteId: noteId1 })
      } catch (e) {
        err = e
      }
      await tap.ok(err)
      await tap.equal(err.message, 'duplicate')
    }
  )

  await tap.test('Update Outline Data', async () => {
    let err
    try {
      await OutlineData.update({
        noteId: noteId1,
        previous: noteId2,
        next: noteId5,
        parentId: noteId4
      })
    } catch (e) {
      err = e
    }
    await tap.notOk(err)
  })

  await tap.test('Delete Outline Data for Note', async () => {
    const res = await OutlineData.delete(noteId1)

    await tap.equal(res, 1)

    // trying again with same note, should return 0
    const res2 = await OutlineData.delete(noteId1)

    await tap.equal(res2, 0)
  })

  await destroyDB(app)
}

module.exports = test
