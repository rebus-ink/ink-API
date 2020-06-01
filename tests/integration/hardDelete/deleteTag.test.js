const request = require('supertest')
const tap = require('tap')
const { getToken, createUser, destroyDB } = require('../../utils/testUtils')
const app = require('../../../server').app
const { urlToId } = require('../../../utils/utils')
const { Note } = require('../../../models/Note')
const { Tag } = require('../../../models/Tag')
const { Note_Tag } = require('../../../models/Note_Tag')
const { Source } = require('../../../models/Source')
const { Source_Tag } = require('../../../models/Sources_Tags')
const { Notebook } = require('../../../models/Notebook')
const { Notebook_Tag } = require('../../../models/Notebook_Tag')

const _ = require('lodash')

const test = async () => {
  const token = getToken()
  const reader = await createUser(app, token)
  const readerId = urlToId(reader)

  // 25 hours ago
  const timestamp25 = new Date(Date.now() - 90000 * 1000).toISOString()
  // now
  const timestampNow = new Date(Date.now()).toISOString()

  // create tags
  const tag1 = await Tag.query().insertAndFetch({
    type: 'test',
    name: 'tag1',
    readerId,
    deleted: timestamp25
  })

  const tag2 = await Tag.query().insertAndFetch({
    type: 'test',
    name: 'tag2',
    readerId,
    deleted: timestamp25
  })

  const tag3 = await Tag.query().insertAndFetch({
    type: 'test',
    name: 'tag3',
    readerId,
    deleted: timestamp25
  })

  const tag4 = await Tag.query().insertAndFetch({
    type: 'test',
    name: 'tag4',
    readerId,
    deleted: timestampNow
  })

  const tag5 = await Tag.query().insertAndFetch({
    type: 'test',
    name: 'tag5',
    readerId
  })

  // create sources, assign tags to sources

  const source1 = await Source.query().insertAndFetch({
    name: 'source1',
    type: 'Article',
    readerId
  })

  await Source_Tag.query().insert({
    sourceId: source1.id,
    tagId: tag1.id
  })

  // create notes, assign tags to notes

  const note = await Note.query().insertAndFetch({
    readerId
  })
  await Note_Tag.query().insert({
    noteId: urlToId(note.id),
    tagId: tag2.id
  })

  // create noteBooks, assign tags to notebooks
  const notebook = await Notebook.query().insertAndFetch({
    name: 'notebook1',
    readerId,
    status: 1
  })

  await Notebook_Tag.query().insert({
    notebookId: notebook.id,
    tagId: tag3.id
  })

  await tap.test('Before hard delete', async () => {
    const tags = await Tag.query()
    await tap.ok(_.find(tags, { id: tag1.id }))
    await tap.ok(_.find(tags, { id: tag2.id }))
    await tap.ok(_.find(tags, { id: tag3.id }))
    await tap.ok(_.find(tags, { id: tag4.id }))
    await tap.ok(_.find(tags, { id: tag5.id }))

    const sources = await Source.query()
    await tap.equal(sources.length, 1)

    const source_tags = await Source_Tag.query()
    await tap.equal(source_tags.length, 1)

    const notes = await Note.query()
    await tap.equal(notes.length, 1)

    const note_tags = await Note_Tag.query()
    await tap.equal(note_tags.length, 1)

    const notebooks = await Notebook.query()
    await tap.equal(notebooks.length, 1)

    const notebook_tags = await Notebook_Tag.query()
    await tap.equal(notebook_tags.length, 1)
  })

  await tap.test('Hard Delete', async () => {
    const res = await request(app)
      .delete('/hardDelete')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.status, 204)

    const tags = await Tag.query()
    await tap.notOk(_.find(tags, { id: tag1.id }))
    await tap.notOk(_.find(tags, { id: tag2.id }))
    await tap.notOk(_.find(tags, { id: tag3.id }))
    await tap.ok(_.find(tags, { id: tag4.id }))
    await tap.ok(_.find(tags, { id: tag5.id }))

    const sources = await Source.query()
    await tap.equal(sources.length, 1)

    const source_tags = await Source_Tag.query()
    await tap.equal(source_tags.length, 0)

    const notes = await Note.query()
    await tap.equal(notes.length, 1)

    const note_tags = await Note_Tag.query()
    await tap.equal(note_tags.length, 0)

    const notebooks = await Notebook.query()
    await tap.equal(notebooks.length, 1)

    const notebook_tags = await Notebook_Tag.query()
    await tap.equal(notebook_tags.length, 0)
  })

  await destroyDB(app)
}

module.exports = test
