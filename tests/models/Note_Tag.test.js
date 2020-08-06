const tap = require('tap')
const { destroyDB } = require('../utils/testUtils')
const { Reader } = require('../../models/Reader')
const { Note } = require('../../models/Note')
const { Tag } = require('../../models/Tag')
const { Note_Tag } = require('../../models/Note_Tag')
const { urlToId } = require('../../utils/utils')
const crypto = require('crypto')
const _ = require('lodash')

const test = async app => {
  const reader = {
    name: 'J. Random Reader'
  }

  const random = crypto.randomBytes(13).toString('hex')

  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)

  const note1 = await Note.createNote(createdReader, {
    body: { content: 'test1', motivation: 'test' }
  })
  const note2 = await Note.createNote(createdReader, {
    body: { content: 'test2', motivation: 'test' }
  })

  const tag1 = await Tag.createTag(urlToId(createdReader.id), {
    name: 'tag1',
    type: 'stack'
  })
  const tag2 = await Tag.createTag(urlToId(createdReader.id), {
    name: 'tag2',
    type: 'stack'
  })
  const tag3 = await Tag.createTag(urlToId(createdReader.id), {
    name: 'tag3',
    type: 'stack'
  })

  await tap.test('Add a tag to a note', async () => {
    const tagNote = await Note_Tag.addTagToNote(urlToId(note1.id), tag1.id)

    await tap.ok(tagNote.noteId)
    await tap.ok(tagNote.tagId)
    await tap.equal(tagNote.tagId, tag1.id)
    await tap.equal(tagNote.noteId, urlToId(note1.id))
  })

  await tap.test(
    'Try to add a tag to a note with an invalid noteId',
    async () => {
      let error
      try {
        await Note_Tag.addTagToNote(urlToId(note1.id) + 'Blah123', tag1.id)
      } catch (err) {
        error = err
      }

      await tap.ok(error)
      await tap.ok(error instanceof Error)
      await tap.ok(error.message, 'no note')
    }
  )

  await tap.test(
    'Try to add a tag to a note with an invalid tagId',
    async () => {
      let error
      try {
        await Note_Tag.addTagToNote(urlToId(note1.id), tag1.id + 'abc')
      } catch (err) {
        error = err
      }

      await tap.ok(error)
      await tap.ok(error instanceof Error)
      await tap.ok(error.message, 'no tag')
    }
  )

  await tap.test('Add multiple tags to a note', async () => {
    await Note_Tag.addMultipleTagsToNote(urlToId(note1.id), [tag2.id, tag3.id])

    const queryResult = await Note_Tag.query().where(
      'noteId',
      '=',
      urlToId(note1.id)
    )
    await tap.equal(queryResult.length, 3)
  })

  await tap.test('Remove Tag from a Note', async () => {
    const result = await Note_Tag.removeTagFromNote(urlToId(note1.id), tag1.id)

    await tap.equal(result, 1)
    const queryResult = await Note_Tag.query().where(
      'noteId',
      '=',
      urlToId(note1.id)
    )
    await tap.equal(queryResult.length, 2)
  })

  await tap.test(
    'Try to Remove Tag from a Note where the assignment does not exist',
    async () => {
      let error
      try {
        await Note_Tag.removeTagFromNote(urlToId(note1.id), tag1.id)
      } catch (err) {
        error = err
      }

      await tap.ok(error)
      await tap.ok(error instanceof Error)
    }
  )

  await tap.test(
    'Try to Remove Tag from a Note with invalid tagId',
    async () => {
      let error
      try {
        await Note_Tag.removeTagFromNote(urlToId(note1.id), tag1.id + 'abc')
      } catch (err) {
        error = err
      }

      await tap.ok(error)
      await tap.ok(error instanceof Error)
    }
  )

  await tap.test('Delete Note-Tags of a Note', async () => {
    await Note_Tag.deleteNoteTagsOfNote(urlToId(note1.id))

    const queryResult = await Note_Tag.query().where(
      'noteId',
      '=',
      urlToId(note1.id)
    )
    await tap.equal(queryResult.length, 0)
  })

  await Note_Tag.addTagToNote(urlToId(note1.id), tag1.id)
  await Note_Tag.addTagToNote(urlToId(note2.id), tag1.id)

  await tap.test('Delete Note-Tags of a Tag', async () => {
    const queryBefore = await Note_Tag.query().where('tagId', '=', tag1.id)
    await tap.equal(queryBefore.length, 2)

    await Note_Tag.deleteNoteTagsOfTag(tag1.id)

    const queryResult = await Note_Tag.query().where('tagId', '=', tag1.id)
    await tap.equal(queryResult.length, 0)
  })

  await Note_Tag.addTagToNote(urlToId(note1.id), tag1.id)
  await Note_Tag.addTagToNote(urlToId(note1.id), tag2.id)

  await tap.test('Replace Tags for a Note', async () => {
    await Note_Tag.replaceTagsForNote(urlToId(note1.id), [tag2.id, tag3.id])

    const queryResult = await Note_Tag.query().where(
      'noteId',
      '=',
      urlToId(note1.id)
    )
    await tap.equal(queryResult.length, 2)
    await tap.ok(_.find(queryResult, { tagId: tag2.id }))
    await tap.ok(_.find(queryResult, { tagId: tag3.id }))
  })

  await destroyDB(app)
}

module.exports = test
