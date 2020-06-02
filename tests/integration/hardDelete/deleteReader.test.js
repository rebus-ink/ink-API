const request = require('supertest')
const tap = require('tap')
const { destroyDB } = require('../../utils/testUtils')
const app = require('../../../server').app
const { urlToId } = require('../../../utils/utils')
const { Note } = require('../../../models/Note')
const { NoteContext } = require('../../../models/NoteContext')
const { Tag } = require('../../../models/Tag')

const { Notebook } = require('../../../models/Notebook')
const { Notebook_Tag } = require('../../../models/Notebook_Tag')
const { Notebook_Note } = require('../../../models/Notebook_Note')
const { Notebook_Source } = require('../../../models/Notebook_Source')
const { Source } = require('../../../models/Source')
const { Attribution } = require('../../../models/Attribution')
const { ReadActivity } = require('../../../models/ReadActivity')
const { Note_Tag } = require('../../../models/Note_Tag')
const { Source_Tag } = require('../../../models/Source_Tag')
const { NoteBody } = require('../../../models/NoteBody')
const { NoteRelation } = require('../../../models/NoteRelation')
const { Reader } = require('../../../models/Reader')

const _ = require('lodash')

const test = async () => {
  // 25 hours ago
  const timestamp25 = new Date(Date.now() - 90000 * 1000).toISOString()
  // now
  const timestampNow = new Date(Date.now()).toISOString()

  const reader1 = await Reader.query().insertAndFetch({
    authId: 'abc',
    name: 'reader1',
    deleted: timestamp25
  })
  const readerId1 = urlToId(reader1.id)

  const reader2 = await Reader.query().insertAndFetch({
    authId: 'abcd',
    name: 'reader2'
  })
  const readerId2 = urlToId(reader2.id)

  const reader3 = await Reader.query().insertAndFetch({
    authId: 'abcde',
    name: 'reader3',
    deleted: timestampNow
  })
  const readerId3 = urlToId(reader3.id)

  // Sources
  const source1 = await Source.query().insertAndFetch({
    name: 'source1',
    type: 'Book',
    readerId: readerId1
  })

  const source2 = await Source.query().insertAndFetch({
    name: 'source2',
    type: 'Book',
    readerId: readerId2
  })

  const source3 = await Source.query().insertAndFetch({
    name: 'source3',
    type: 'Book',
    readerId: readerId3
  })

  // Notebooks
  const notebook1 = await Notebook.query().insertAndFetch({
    name: 'notebook1',
    readerId: readerId1,
    status: 1
  })

  const notebook2 = await Notebook.query().insertAndFetch({
    name: 'notebook2',
    readerId: readerId2,
    status: 1
  })

  const notebook3 = await Notebook.query().insertAndFetch({
    name: 'notebook3',
    readerId: readerId3,
    status: 1
  })

  // NoteContexts

  const context1 = await NoteContext.query().insertAndFetch({
    type: 'test',
    readerId: readerId1
  })

  const context2 = await NoteContext.query().insertAndFetch({
    type: 'test',
    readerId: readerId2
  })

  const context3 = await NoteContext.query().insertAndFetch({
    type: 'test',
    readerId: readerId3
  })

  // Notes

  const note1 = await Note.query().insertAndFetch({
    readerId: readerId1
  })

  const note2 = await Note.query().insertAndFetch({
    readerId: readerId2
  })

  const note3 = await Note.query().insertAndFetch({
    readerId: readerId3
  })

  const note4 = await Note.query().insertAndFetch({
    readerId: readerId1,
    contextId: urlToId(context1.id)
  })

  const note5 = await Note.query().insertAndFetch({
    readerId: readerId1,
    sourceId: urlToId(source1.id)
  })

  // Tags

  const tag1 = await Tag.query().insertAndFetch({
    type: 'test',
    name: 'test tag',
    readerId: readerId1
  })

  const tag2 = await Tag.query().insertAndFetch({
    type: 'test',
    name: 'test tag',
    readerId: readerId2
  })

  const tag3 = await Tag.query().insertAndFetch({
    type: 'test',
    name: 'test tag',
    readerId: readerId3
  })

  const tag4 = await Tag.query().insertAndFetch({
    type: 'test',
    name: 'test tag3',
    readerId: readerId1,
    notebookId: urlToId(notebook1.id)
  })

  const tag5 = await Tag.query().insertAndFetch({
    type: 'test',
    name: 'test tag2',
    readerId: readerId1
  })

  // Attributions

  const attribution1 = await Attribution.query().insertAndFetch({
    role: 'author',
    name: 'author1',
    normalizedName: 'johnsmith',
    readerId: readerId1,
    sourceId: source1.id
  })

  const attribution2 = await Attribution.query().insertAndFetch({
    role: 'author',
    name: 'author1',
    normalizedName: 'johnsmith',
    readerId: readerId2,
    sourceId: source2.id
  })

  const attribution3 = await Attribution.query().insertAndFetch({
    role: 'author',
    name: 'author1',
    normalizedName: 'johnsmith',
    readerId: readerId3,
    sourceId: source3.id
  })

  // readActivity

  // readActivity1
  await ReadActivity.query().insertAndFetch({
    selector: { something: '!!' },
    readerId: readerId1,
    sourceId: source1.id
  })

  // readActivity2
  await ReadActivity.query().insertAndFetch({
    selector: { something: '!!' },
    readerId: readerId2,
    sourceId: source2.id
  })

  // readActivity3
  await ReadActivity.query().insertAndFetch({
    selector: { something: '!!' },
    readerId: readerId3,
    sourceId: source3.id
  })

  // Note_Tag

  await Note_Tag.query().insert({
    noteId: urlToId(note1.id),
    tagId: tag1.id
  })

  await Note_Tag.query().insert({
    noteId: urlToId(note2.id),
    tagId: tag2.id
  })

  await Note_Tag.query().insert({
    noteId: urlToId(note3.id),
    tagId: tag3.id
  })

  // SOURCE_TAG

  await Source_Tag.query().insert({
    sourceId: urlToId(source1.id),
    tagId: tag1.id
  })

  await Source_Tag.query().insert({
    sourceId: urlToId(source2.id),
    tagId: tag2.id
  })

  await Source_Tag.query().insert({
    sourceId: urlToId(source3.id),
    tagId: tag3.id
  })

  // NoteBody
  await NoteBody.query().insert({
    noteId: urlToId(note1.id),
    motivation: 'test',
    readerId: readerId1
  })

  await NoteBody.query().insert({
    noteId: urlToId(note2.id),
    motivation: 'test',
    readerId: readerId2
  })

  await NoteBody.query().insert({
    noteId: urlToId(note3.id),
    motivation: 'test',
    readerId: readerId3
  })

  // NoteRelation
  await NoteRelation.query().insert({
    from: urlToId(note1.id),
    to: urlToId(note4.id),
    type: 'test',
    readerId: readerId1
  })

  // Notebook_Tag

  await Notebook_Tag.query().insert({
    tagId: tag1.id,
    notebookId: urlToId(notebook1.id)
  })

  await Notebook_Tag.query().insert({
    tagId: tag2.id,
    notebookId: urlToId(notebook2.id)
  })

  await Notebook_Tag.query().insert({
    tagId: tag3.id,
    notebookId: urlToId(notebook3.id)
  })

  // Notebook_Source
  await Notebook_Source.query().insert({
    sourceId: urlToId(source1.id),
    notebookId: urlToId(notebook1.id)
  })

  await Notebook_Source.query().insert({
    sourceId: urlToId(source2.id),
    notebookId: urlToId(notebook2.id)
  })

  await Notebook_Source.query().insert({
    sourceId: urlToId(source3.id),
    notebookId: urlToId(notebook3.id)
  })

  // Notebook_Note

  await Notebook_Note.query().insert({
    noteId: urlToId(note1.id),
    notebookId: urlToId(notebook1.id)
  })

  await Notebook_Note.query().insert({
    noteId: urlToId(note2.id),
    notebookId: urlToId(notebook2.id)
  })

  await Notebook_Note.query().insert({
    noteId: urlToId(note3.id),
    notebookId: urlToId(notebook3.id)
  })

  await tap.test('Before hard delete', async () => {
    const readers = await Reader.query()
    await tap.equal(readers.length, 3)

    const sources = await Source.query()
    await tap.equal(sources.length, 3)

    const notebooks = await Notebook.query()
    await tap.equal(notebooks.length, 3)

    const contexts = await NoteContext.query()
    await tap.equal(contexts.length, 3)

    const notes = await Note.query()
    await tap.equal(notes.length, 5)

    const tags = await Tag.query()
    await tap.equal(tags.length, 5)

    const attributions = await Attribution.query()
    await tap.equal(attributions.length, 3)

    const readActivities = await ReadActivity.query()
    await tap.equal(readActivities.length, 3)

    const source_tags = await Source_Tag.query()
    await tap.equal(source_tags.length, 3)

    const note_tags = await Note_Tag.query()
    await tap.equal(note_tags.length, 3)

    const noteBodies = await NoteBody.query()
    await tap.equal(noteBodies.length, 3)

    const relations = await NoteRelation.query()
    await tap.equal(relations.length, 1)

    const notebook_tags = await Notebook_Tag.query()
    await tap.equal(notebook_tags.length, 3)

    const notebook_notes = await Notebook_Note.query()
    await tap.equal(notebook_notes.length, 3)

    const notebook_sources = await Notebook_Source.query()
    await tap.equal(notebook_sources.length, 3)
  })

  await tap.test('Hard Delete', async () => {
    const res = await request(app)
      .delete('/hardDelete')
      .set('Host', 'reader-api.test')
      .type('application/ld+json')
    await tap.equal(res.status, 204)

    const readers = await Reader.query()
    await tap.equal(readers.length, 2)
    await tap.notOk(_.find(readers, { id: reader1.id }))
    await tap.ok(_.find(readers, { id: reader2.id }))
    await tap.ok(_.find(readers, { id: reader3.id }))

    const sources = await Source.query()
    await tap.equal(sources.length, 2)
    await tap.notOk(_.find(sources, { id: source1.id }))
    await tap.ok(_.find(sources, { id: source2.id }))
    await tap.ok(_.find(sources, { id: source3.id }))

    const notebooks = await Notebook.query()
    await tap.equal(notebooks.length, 2)
    await tap.notOk(_.find(notebooks, { id: notebook1.id }))
    await tap.ok(_.find(notebooks, { id: notebook2.id }))
    await tap.ok(_.find(notebooks, { id: notebook3.id }))

    const contexts = await NoteContext.query()
    await tap.equal(contexts.length, 2)
    await tap.notOk(_.find(contexts, { id: context1.id }))
    await tap.ok(_.find(contexts, { id: context2.id }))
    await tap.ok(_.find(contexts, { id: context3.id }))

    const notes = await Note.query()
    await tap.equal(notes.length, 2)
    await tap.notOk(_.find(notes, { id: note1.id }))
    await tap.ok(_.find(notes, { id: note2.id }))
    await tap.ok(_.find(notes, { id: note3.id }))
    await tap.notOk(_.find(notes, { id: note4.id }))
    await tap.notOk(_.find(notes, { id: note5.id }))

    const tags = await Tag.query()
    await tap.equal(tags.length, 2)
    await tap.notOk(_.find(tags, { id: tag1.id }))
    await tap.ok(_.find(tags, { id: tag2.id }))
    await tap.ok(_.find(tags, { id: tag3.id }))
    await tap.notOk(_.find(tags, { id: tag4.id }))
    await tap.notOk(_.find(tags, { id: tag5.id }))

    const attributions = await Attribution.query()
    await tap.equal(attributions.length, 2)
    await tap.notOk(_.find(attributions, { id: attribution1.id }))
    await tap.ok(_.find(attributions, { id: attribution2.id }))
    await tap.ok(_.find(attributions, { id: attribution3.id }))

    const readActivities = await ReadActivity.query()
    await tap.equal(readActivities.length, 2)
    await tap.notOk(_.find(readActivities, { sourceId: source1.id }))
    await tap.ok(_.find(readActivities, { sourceId: source2.id }))
    await tap.ok(_.find(readActivities, { sourceId: source3.id }))

    const source_tags = await Source_Tag.query()
    await tap.equal(source_tags.length, 2)
    await tap.notOk(_.find(source_tags, { sourceId: source1.id }))
    await tap.ok(_.find(source_tags, { sourceId: source2.id }))
    await tap.ok(_.find(source_tags, { sourceId: source3.id }))

    const note_tags = await Note_Tag.query()
    await tap.equal(note_tags.length, 2)
    await tap.notOk(_.find(note_tags, { noteId: urlToId(note1.id) }))
    await tap.ok(_.find(note_tags, { noteId: urlToId(note2.id) }))
    await tap.ok(_.find(note_tags, { noteId: urlToId(note3.id) }))

    const noteBodies = await NoteBody.query()
    await tap.equal(noteBodies.length, 2)
    await tap.notOk(_.find(noteBodies, { noteId: note1.id }))
    await tap.ok(_.find(noteBodies, { noteId: note2.id }))
    await tap.ok(_.find(noteBodies, { noteId: note3.id }))

    const relations = await NoteRelation.query()
    await tap.equal(relations.length, 0)

    const notebook_tags = await Notebook_Tag.query()
    await tap.equal(notebook_tags.length, 2)
    await tap.notOk(
      _.find(notebook_tags, { notebookId: urlToId(notebook1.id) })
    )
    await tap.ok(_.find(notebook_tags, { notebookId: urlToId(notebook2.id) }))
    await tap.ok(_.find(notebook_tags, { notebookId: urlToId(notebook3.id) }))

    const notebook_notes = await Notebook_Note.query()
    await tap.equal(notebook_notes.length, 2)
    await tap.notOk(
      _.find(notebook_notes, { notebookId: urlToId(notebook1.id) })
    )
    await tap.ok(_.find(notebook_notes, { notebookId: urlToId(notebook2.id) }))
    await tap.ok(_.find(notebook_notes, { notebookId: urlToId(notebook3.id) }))

    const notebook_sources = await Notebook_Source.query()
    await tap.equal(notebook_sources.length, 2)
    await tap.notOk(
      _.find(notebook_sources, { notebookId: urlToId(notebook1.id) })
    )
    await tap.ok(
      _.find(notebook_sources, { notebookId: urlToId(notebook2.id) })
    )
    await tap.ok(
      _.find(notebook_sources, { notebookId: urlToId(notebook3.id) })
    )
  })

  await destroyDB(app)
}

module.exports = test
