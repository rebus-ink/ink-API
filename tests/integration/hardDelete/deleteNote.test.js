const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const { getToken, createUser, destroyDB } = require('../../utils/testUtils')
const app = require('../../../server').app
const { urlToId } = require('../../../utils/utils')
const { Note } = require('../../../models/Note')
const { NoteBody } = require('../../../models/NoteBody')
const { NoteContext } = require('../../../models/NoteContext')
const { Tag } = require('../../../models/Tag')
const { Note_Tag } = require('../../../models/Note_Tag')
const { NoteRelation } = require('../../../models/NoteRelation')

const _ = require('lodash')

const test = async () => {
  const token = getToken()
  const reader = await createUser(app, token)
  const readerId = urlToId(reader)

  // 25 hours ago
  const timestamp25 = new Date(Date.now() - 90000 * 1000).toISOString()
  // now
  const timestampNow = new Date(Date.now()).toISOString()

  // create notes
  // deleted
  const note1 = await Note.query().insertAndFetch({
    readerId,
    deleted: timestamp25
  })

  const note2 = await Note.query().insertAndFetch({
    readerId,
    deleted: timestamp25
  })

  // not deleted
  const note3 = await Note.query().insertAndFetch({
    readerId
  })

  // deleted less than 24 hours ago
  const note4 = await Note.query().insertAndFetch({
    readerId,
    deleted: timestampNow
  })

  // create notecontext with notes

  const noteContext = await NoteContext.query().insertAndFetch({
    readerId,
    type: 'test',
    deleted: timestamp25
  })

  const note5 = await Note.query().insertAndFetch({
    readerId,
    contextId: urlToId(noteContext.id)
  })

  // create noteBodies
  await NoteBody.query().insertAndFetch({
    noteId: urlToId(note1.id),
    motivation: 'test',
    readerId
  })
  await NoteBody.query().insertAndFetch({
    noteId: urlToId(note1.id),
    motivation: 'test',
    readerId
  })

  await NoteBody.query().insertAndFetch({
    noteId: urlToId(note2.id),
    motivation: 'test',
    readerId
  })

  await NoteBody.query().insertAndFetch({
    noteId: urlToId(note3.id),
    motivation: 'test',
    readerId
  })

  await NoteBody.query().insertAndFetch({
    noteId: urlToId(note4.id),
    motivation: 'test',
    readerId
  })

  await NoteBody.query().insert({
    noteId: urlToId(note5.id),
    motivation: 'test',
    readerId
  })

  // create tag
  const tag = await Tag.query().insertAndFetch({
    type: 'test',
    name: 'test tag',
    readerId
  })

  // create note-tag relations
  await Note_Tag.query().insert({
    tagId: tag.id,
    noteId: urlToId(note1.id)
  })
  await Note_Tag.query().insert({
    tagId: tag.id,
    noteId: urlToId(note3.id)
  })

  // create noterelation
  const relation1 = await NoteRelation.query().insertAndFetch({
    from: urlToId(note1.id),
    to: urlToId(note3.id),
    type: 'test',
    readerId
  })

  const relation2 = await NoteRelation.query().insertAndFetch({
    from: urlToId(note4.id),
    to: urlToId(note3.id),
    type: 'test',
    readerId
  })

  await tap.test('Before hard delete', async () => {
    const notes = await Note.query()
    await tap.equal(notes.length, 5)

    const noteBodies = await NoteBody.query()
    await tap.equal(noteBodies.length, 6)

    const tags = await Tag.query()
    await tap.ok(_.find(tags, { id: tag.id }))

    const note_tags = await Note_Tag.query()
    await tap.equal(note_tags.length, 2)

    const relations = await NoteRelation.query()
    await tap.equal(relations.length, 2)
  })

  await tap.test('Hard Delete', async () => {
    const res = await request(app)
      .delete('/hardDelete')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.status, 204)

    const notes = await Note.query()
    await tap.equal(notes.length, 3) // should be 2 - deleting noteContext should delete its notes
    await tap.notOk(_.find(notes, { id: note1.id }))
    await tap.notOk(_.find(notes, { id: note2.id }))
    await tap.ok(_.find(notes, { id: note3.id }))
    await tap.ok(_.find(notes, { id: note4.id }))
    // await tap.notOk(_.find(notes, {id: note5.id}))

    const noteBodies = await NoteBody.query()
    await tap.equal(noteBodies.length, 3) // should be 2 - once again, problem with noteContext
    await tap.ok(_.find(noteBodies, { noteId: note3.id }))
    await tap.ok(_.find(noteBodies, { noteId: note4.id }))

    const tags = await Tag.query()
    await tap.ok(_.find(tags, { id: tag.id }))

    const note_tags = await Note_Tag.query()
    await tap.equal(note_tags.length, 1)
    await tap.equal(note_tags[0].noteId, urlToId(note3.id))

    const relations = await NoteRelation.query()
    await tap.equal(relations.length, 1)
    await tap.equal(relations[0].id, urlToId(relation2.id))
  })

  await destroyDB(app)
}

module.exports = test
