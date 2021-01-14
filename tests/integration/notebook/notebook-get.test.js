const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNotebook,
  addSourceToNotebook,
  createSource,
  addNoteToNotebook,
  addTagToNotebook,
  createTag,
  createNote,
  createCanvas,
  createNoteContext,
  addSourceToCollection,
  addNoteToCollection
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const reader = await createUser(app, token)

  const notebook = await createNotebook(app, token, {
    name: 'notebook1',
    status: 'archived',
    description: 'test',
    settings: {
      property: 'value'
    }
  })

  await tap.test('Get empty notebook', async () => {
    const res = await request(app)
      .get(`/notebooks/${notebook.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.id)
    await tap.ok(body.id.startsWith('http'))
    await tap.ok(body.shortId)
    await tap.ok(body.shortId.startsWith(urlToId(reader)))
    await tap.equal(body.name, 'notebook1')
    await tap.equal(body.description, 'test')
    await tap.equal(body.status, 'archived')
    await tap.equal(body.settings.property, 'value')
    // notes, tags, notebookTags, sources, noteContexts
    await tap.equal(body.notes.length, 0)
    await tap.equal(body.tags.length, 0)
    await tap.equal(body.notebookTags.length, 0)
    await tap.equal(body.sources.length, 0)
    await tap.equal(body.noteContexts.length, 0)
  })

  const source = await createSource(app, token)
  await addSourceToNotebook(app, token, source.shortId, notebook.shortId)

  const note = await createNote(app, token, {
    body: { content: 'test!!', motivation: 'test' },
    sourceId: source.shortId
  })
  await addNoteToNotebook(app, token, note.shortId, notebook.shortId)

  const tag = await createTag(app, token)
  await addTagToNotebook(app, token, tag.id, notebook.shortId)

  const notebookTag = await createTag(app, token, {
    name: 'testing!',
    notebookId: notebook.shortId
  })

  const notebookNoteContext = await createNoteContext(app, token, {
    notebookId: notebook.shortId
  })

  await tap.test('Get notebook with source', async () => {
    const res = await request(app)
      .get(`/notebooks/${notebook.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(body.name, 'notebook1')
    await tap.equal(body.description, 'test')
    await tap.equal(body.status, 'archived')
    await tap.equal(body.settings.property, 'value')
    // notes, tags, notebookTags, sources, noteContexts
    await tap.equal(body.notes.length, 1)
    await tap.equal(body.notes[0].shortId, note.shortId)
    await tap.equal(body.notes[0].body[0].content, 'test!!')
    await tap.equal(body.tags.length, 1)
    await tap.equal(body.tags[0].id, tag.id)
    await tap.equal(body.notebookTags.length, 1)
    await tap.equal(body.notebookTags[0].id, notebookTag.id)
    await tap.equal(body.sources.length, 1)
    await tap.equal(body.sources[0].shortId, source.shortId)
    await tap.ok(body.sources[0].author)
    await tap.equal(body.sources[0].author.length, 1)
    await tap.equal(body.noteContexts.length, 1)
    await tap.equal(body.noteContexts[0].shortId, notebookNoteContext.shortId)
  })

  await addNoteToCollection(app, token, note.shortId, tag.id)
  await addSourceToCollection(app, token, source.shortId, tag.id)
  await createCanvas(app, token, {
    notebookId: notebook.shortId,
    name: 'canvas1',
    description: 'something'
  })

  await tap.test('Get notebook with source tags, note tags...', async () => {
    const res = await request(app)
      .get(`/notebooks/${notebook.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.id)
    // notes, tags, notebookTags, sources, noteContexts
    await tap.equal(body.notes.length, 1)
    await tap.equal(body.notes[0].tags.length, 1)
    await tap.equal(body.sources.length, 1)
    await tap.equal(body.sources[0].tags.length, 1)
    await tap.equal(body.canvas.length, 1)
  })

  await tap.test('Try to get a Notebook that does not exist', async () => {
    const res = await request(app)
      .get(`/notebooks/${notebook.shortId}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(
      error.message,
      `Get Notebook Error: No Notebook found with id ${notebook.shortId}abc`
    )
    await tap.equal(
      error.details.requestUrl,
      `/notebooks/${notebook.shortId}abc`
    )
  })

  await destroyDB(app)
}

module.exports = test
