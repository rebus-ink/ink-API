const tap = require('tap')
const { destroyDB } = require('../utils/testUtils')
const { Reader } = require('../../models/Reader')
const { urlToId } = require('../../utils/utils')
const crypto = require('crypto')
const { NoteRelationContext } = require('../../models/NoteRelationContext')
const { ValidationError } = require('objection')
const { Note } = require('../../models/Note')
const { NoteRelation } = require('../../models/NoteRelation')
const _ = require('lodash')

const test = async app => {
  const reader = {
    name: 'J. Random Reader'
  }
  const random = crypto.randomBytes(13).toString('hex')
  const createdReader = await Reader.createReader(`auth0|foo${random}`, reader)
  const readerId = urlToId(createdReader.id)

  // relations to create with the tests:
  // note1 alone
  // from note1 to note2
  // from note2 to note3 with context
  // note4 alone with context
  const note1 = await Note.createNote(createdReader, {
    body: { motivation: 'test', content: 'note 1' }
  })
  const noteId1 = urlToId(note1.id)
  const note2 = await Note.createNote(createdReader, {
    body: { motivation: 'test', content: 'note 2' }
  })
  const noteId2 = urlToId(note2.id)
  const note3 = await Note.createNote(createdReader, {
    body: { motivation: 'test', content: 'note 3' }
  })
  const noteId3 = urlToId(note3.id)
  const note4 = await Note.createNote(createdReader, {
    body: { motivation: 'test', content: 'note 4' }
  })
  const noteId4 = urlToId(note4.id)

  const noteRelContext = await NoteRelationContext.createNoteRelationContext(
    { type: 'test' },
    readerId
  )

  let noteRel1, noteRel1_2, noteRel2_3, noteRel4

  await tap.test('Create NoteRelation with one note', async () => {
    let error
    try {
      noteRel1 = await NoteRelation.createNoteRelation(
        {
          from: noteId1,
          type: 'test'
        },
        readerId
      )
    } catch (err) {
      console.log(err)
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test('Create NoteRelation with two notes', async () => {
    let error
    try {
      noteRel1_2 = await NoteRelation.createNoteRelation(
        {
          from: noteId1,
          to: noteId2,
          type: 'test'
        },
        readerId
      )
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test('Create NoteRelation with context', async () => {
    let error
    try {
      noteRel2_3 = await NoteRelation.createNoteRelation(
        {
          from: noteId2,
          to: noteId3,
          type: 'test',
          contextId: noteRelContext.id
        },
        readerId
      )
    } catch (err) {
      error = err
    }
    await tap.notOk(error)
  })

  await tap.test(
    'Create NoteRelation with only one note with context',
    async () => {
      let error
      try {
        noteRel4 = await NoteRelation.createNoteRelation(
          {
            from: noteId4,
            type: 'test',
            contextId: noteRelContext.id
          },
          readerId
        )
      } catch (err) {
        error = err
      }
      await tap.notOk(error)
    }
  )

  await tap.test('Try to create a NoteRelation without a type', async () => {
    let error
    try {
      noteRel4 = await NoteRelation.createNoteRelation(
        {
          from: noteId4,
          contextId: noteRelContext.id
        },
        readerId
      )
    } catch (err) {
      error = err
    }
    await tap.ok(error)
    await tap.ok(error instanceof ValidationError)
  })

  await tap.test(
    'Try to create a NoteRelation without a from Note',
    async () => {
      let error
      try {
        noteRel4 = await NoteRelation.createNoteRelation(
          {
            type: 'test',
            contextId: noteRelContext.id
          },
          readerId
        )
      } catch (err) {
        error = err
      }
      await tap.ok(error)
      await tap.ok(error instanceof ValidationError)
    }
  )

  await tap.test('Get NoteRelations for a Note', async () => {
    const result = await NoteRelation.getRelationsForNote(noteId1)
    await tap.equal(result.length, 2)
    await tap.ok(_.find(result, { id: noteRel1.id }))
    await tap.ok(_.find(result, { id: noteRel1_2.id }))
  })

  await tap.test('Get NoteRelations for a Context', async () => {
    const result = await NoteRelation.getRelationsForContext(noteRelContext.id)
    await tap.equal(result.length, 2)
    await tap.ok(_.find(result, { id: noteRel2_3.id }))
    await tap.ok(_.find(result, { id: noteRel4.id }))
  })

  await tap.test('update NoteRelation', async () => {
    const result = await NoteRelation.updateNoteRelation(
      Object.assign(noteRel1_2, { to: noteId4, type: 'test2' })
    )
    await tap.equal(result.id, noteRel1_2.id)
    await tap.equal(result.to, noteId4)
    await tap.equal(result.from, noteId1)
    await tap.equal(result.type, 'test2')
  })

  await destroyDB(app)
}

module.exports = test
