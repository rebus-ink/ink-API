const request = require('supertest')
const tap = require('tap')
const {
  getToken,
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
  addNoteToCollection,
  createCollaborator,
  createReader
} = require('../../utils/testUtils')

const test = async app => {
  // owner, collab1, collab2
  const token = getToken()
  // owner
  await createReader(app, token)
  const token2 = getToken()
  const collab1 = await createReader(app, token2) // will be pending
  const token3 = getToken()
  const collab2 = await createReader(app, token3) // will be accepted

  const notebook = await createNotebook(app, token, {
    name: 'notebook1',
    status: 'archived',
    description: 'test',
    settings: {
      property: 'value'
    }
  })

  await createCollaborator(app, token, notebook.shortId, {
    readerId: collab1.shortId,
    status: 'pending',
    permission: { read: true }
  })

  await createCollaborator(app, token, notebook.shortId, {
    readerId: collab2.shortId,
    status: 'accepted',
    permission: { read: true }
  })

  await tap.test(
    'Get empty notebook with collaborators - by owner',
    async () => {
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
      await tap.equal(body.name, 'notebook1')
      await tap.equal(body.description, 'test')
      await tap.equal(body.status, 'archived')
      await tap.equal(body.settings.property, 'value')
      await tap.equal(body.collaborators.length, 2)
      await tap.ok(body.collaborators[0].reader)
      // notes, tags, notebookTags, sources, noteContexts
      await tap.equal(body.notes.length, 0)
      await tap.equal(body.tags.length, 0)
      await tap.equal(body.notebookTags.length, 0)
      await tap.equal(body.sources.length, 0)
      await tap.equal(body.noteContexts.length, 0)
    }
  )

  await tap.test(
    'Accepted collaborator should be able to get the notebook',
    async () => {
      const res = await request(app)
        .get(`/notebooks/${notebook.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token3}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      const body = res.body
      await tap.equal(body.name, 'notebook1')
      await tap.equal(body.description, 'test')
      await tap.equal(body.status, 'archived')
      await tap.equal(body.settings.property, 'value')
      await tap.equal(body.collaborators.length, 2)
      await tap.ok(body.collaborators[0].reader)
    }
  )

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

  await tap.test('Get notebook with source, by collaborator', async () => {
    const res = await request(app)
      .get(`/notebooks/${notebook.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token3}`)
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

  await tap.test(
    'Get notebook with source tags, note tags..., by collaborator',
    async () => {
      const res = await request(app)
        .get(`/notebooks/${notebook.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token3}`)
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
    }
  )

  await tap.test(
    'Try to get a notebook by a pending collaborator',
    async () => {
      const res = await request(app)
        .get(`/notebooks/${notebook.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.status, 403)
    }
  )

  await destroyDB(app)
}

module.exports = test
