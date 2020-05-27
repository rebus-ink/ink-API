const request = require('supertest')
const tap = require('tap')
const { getToken, createUser, destroyDB } = require('../../utils/testUtils')
const app = require('../../../server').app
const { urlToId } = require('../../../utils/utils')
const { Note } = require('../../../models/Note')
const { NoteContext } = require('../../../models/NoteContext')
const { Tag } = require('../../../models/Tag')

const { Notebook } = require('../../../models/Notebook')
const { Notebook_Tag } = require('../../../models/Notebook_Tag')
const { Notebook_Note } = require('../../../models/Notebook_Note')
const { Notebook_Pub } = require('../../../models/Notebook_Pub')
const { Publication } = require('../../../models/Publication')

const _ = require('lodash')

const test = async () => {
  const token = getToken()
  const reader = await createUser(app, token)
  const readerId = urlToId(reader)

  // 25 hours ago
  const timestamp25 = new Date(Date.now() - 90000 * 1000).toISOString()
  // now
  const timestampNow = new Date(Date.now()).toISOString()

  // create notebook
  const notebook1 = await Notebook.query().insertAndFetch({
    name: 'notebook1',
    readerId,
    status: 1,
    deleted: timestamp25
  })

  const notebook2 = await Notebook.query().insertAndFetch({
    name: 'notebook2',
    readerId,
    status: 1,
    deleted: timestamp25
  })

  // not deleted
  const notebook3 = await Notebook.query().insertAndFetch({
    name: 'notebook3',
    readerId,
    status: 1
  })
  // deleted recently
  const notebook4 = await Notebook.query().insertAndFetch({
    name: 'notebook4',
    readerId,
    status: 1,
    deleted: timestampNow
  })

  // create tag and notebook-tag relation
  const tag1 = await Tag.query().insertAndFetch({
    type: 'test',
    name: 'test tag',
    readerId
  })

  await Notebook_Tag.query().insert({
    tagId: tag1.id,
    notebookId: urlToId(notebook1.id)
  })

  await Notebook_Tag.query().insert({
    tagId: tag1.id,
    notebookId: urlToId(notebook3.id)
  })

  // create tag with notebookId
  const tag2 = await Tag.query().insertAndFetch({
    type: 'test',
    name: 'test tag2',
    readerId,
    notebookId: urlToId(notebook1.id)
  })

  const tag3 = await Tag.query().insertAndFetch({
    type: 'test',
    name: 'test tag3',
    readerId,
    notebookId: urlToId(notebook4.id)
  })

  // create note and notebook-note relation

  const note1 = await Note.query().insertAndFetch({
    readerId
  })

  await Notebook_Note.query().insert({
    noteId: urlToId(note1.id),
    notebookId: urlToId(notebook1.id)
  })

  await Notebook_Note.query().insert({
    noteId: urlToId(note1.id),
    notebookId: urlToId(notebook3.id)
  })

  // create pub and notebook-pub relation

  const pub = await Publication.query().insertAndFetch({
    name: 'test',
    type: 'Book',
    readerId
  })

  await Notebook_Pub.query().insert({
    publicationId: urlToId(pub.id),
    notebookId: urlToId(notebook1.id)
  })

  await Notebook_Pub.query().insert({
    publicationId: urlToId(pub.id),
    notebookId: urlToId(notebook4.id)
  })

  // create noteContexts

  const context1 = await NoteContext.query().insertAndFetch({
    type: 'test',
    readerId,
    notebookId: urlToId(notebook1.id)
  })

  const context2 = await NoteContext.query().insertAndFetch({
    type: 'test',
    readerId,
    notebookId: urlToId(notebook3.id)
  })

  const context3 = await NoteContext.query().insertAndFetch({
    type: 'test',
    readerId,
    notebookId: urlToId(notebook3.id),
    deleted: timestamp25
  })

  await tap.test('Before hard delete', async () => {
    const notebooks = await Notebook.query()
    await tap.equal(notebooks.length, 4)

    const notes = await Note.query()
    await tap.equal(notes.length, 1)

    const tags = await Tag.query()
    await tap.ok(_.find(tags, { id: tag1.id }))
    await tap.ok(_.find(tags, { id: tag2.id }))
    await tap.ok(_.find(tags, { id: tag3.id }))

    const notebook_tags = await Notebook_Tag.query()
    await tap.equal(notebook_tags.length, 2)

    const notebook_notes = await Notebook_Note.query()
    await tap.equal(notebook_notes.length, 2)

    const pubs = await Publication.query()
    await tap.equal(pubs.length, 1)

    const notebook_pubs = await Notebook_Pub.query()
    await tap.equal(notebook_pubs.length, 2)

    const contexts = await NoteContext.query()
    await tap.equal(contexts.length, 3)
  })

  await tap.test('Hard Delete', async () => {
    const res = await request(app)
      .delete('/hardDelete')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.status, 204)

    const notebooks = await Notebook.query()
    await tap.equal(notebooks.length, 2)
    await tap.notOk(_.find(notebooks, { id: urlToId(notebook1.id) }))
    await tap.notOk(_.find(notebooks, { id: urlToId(notebook2.id) }))
    await tap.ok(_.find(notebooks, { id: urlToId(notebook3.id) }))
    await tap.ok(_.find(notebooks, { id: urlToId(notebook4.id) }))

    const notes = await Note.query()
    await tap.equal(notes.length, 1)

    const tags = await Tag.query()
    await tap.ok(_.find(tags, { id: tag1.id }))
    await tap.notOk(_.find(tags, { id: tag2.id }))
    await tap.ok(_.find(tags, { id: tag3.id }))

    const notebook_tags = await Notebook_Tag.query()
    await tap.equal(notebook_tags.length, 1)
    await tap.equal(notebook_tags[0].notebookId, urlToId(notebook3.id))

    const notebook_notes = await Notebook_Note.query()
    await tap.equal(notebook_notes.length, 1)
    await tap.equal(notebook_notes[0].notebookId, urlToId(notebook3.id))

    const pubs = await Publication.query()
    await tap.equal(pubs.length, 1)

    const notebook_pubs = await Notebook_Pub.query()
    await tap.equal(notebook_pubs.length, 1)
    await tap.equal(notebook_pubs[0].notebookId, urlToId(notebook4.id))

    const contexts = await NoteContext.query()
    await tap.equal(contexts.length, 1)
    await tap.equal(contexts[0].id, context2.id)
  })

  await destroyDB(app)
}

module.exports = test
