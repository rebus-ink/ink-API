const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  destroyDB,
  createReader,
  createCollaborator,
  createSource,
  addSourceToNotebook,
  addNoteToNotebook,
  createNote,
  createNotebook,
  createNoteContext
} = require('../../utils/testUtils')

const test = async app => {
  // Create owner, collaborator and stranger
  const token = getToken()
  // owner:
  await createReader(app, token)
  const token2 = getToken()
  const collab = await createReader(app, token2)
  const token3 = getToken()
  const stranger = await createReader(app, token3)
  const token4 = getToken()
  const pendingCollab = await createReader(app, token4)
  const token5 = getToken()
  const noReadCollab = await createReader(app, token5)

  // create notebook and collab
  const notebook = await createNotebook(app, token, { name: 'my notebook' })
  const collaboratorObject = await createCollaborator(
    app,
    token,
    notebook.shortId,
    {
      readerId: collab.shortId,
      status: 'accepted',
      permission: {
        read: true,
        comment: true
      }
    }
  )
  // pending
  await createCollaborator(app, token, notebook.shortId, {
    readerId: pendingCollab.shortId,
    status: 'pending',
    permission: {
      read: true,
      comment: true
    }
  })

  // no read
  await createCollaborator(app, token, notebook.shortId, {
    readerId: noReadCollab.shortId,
    status: 'accepted',
    permission: {
      read: false,
      comment: true
    }
  })

  const source = await createSource(app, token)
  await addSourceToNotebook(app, token, source.shortId, notebook.shortId)

  const note = await createNote(app, token, { body: { motivation: 'test' } })
  await addNoteToNotebook(app, token, note.shortId, notebook.shortId)

  const noteContext = await createNoteContext(app, token, {
    type: 'test',
    notebookId: notebook.shortId
  })

  const outline = await createNoteContext(app, token, {
    type: 'outline',
    notebookId: notebook.shortId
  })

  const note1 = await createNote(app, token, {
    body: { motivation: 'test' },
    contextId: noteContext.shortId
  })

  const note2 = await createNote(app, token, {
    body: { motivation: 'test' },
    contextId: outline.shortId
  })

  await tap.test(
    'Try to create a collaborator in a notebook you do not own',
    async () => {
      const res = await request(app)
        .post(`/notebooks/${notebook.shortId}/collaborators`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token3}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            readerId: stranger.shortId,
            status: 'accepted',
            permission: { read: true }
          })
        )

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to notebook ${notebook.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook.shortId}/collaborators`
      )
    }
  )

  await tap.test('Try to update a collaborator by a stranger', async () => {
    const res = await request(app)
      .put(
        `/notebooks/${notebook.shortId}/collaborators/${
          collaboratorObject.shortId
        }`
      )
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token3}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          readerId: collab.shortId,
          status: 'accepted',
          permission: { read: true }
        })
      )

    await tap.equal(res.statusCode, 403)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 403)
    await tap.equal(error.error, 'Forbidden')
    await tap.equal(
      error.message,
      `Access to Collaborator ${collaboratorObject.shortId} disallowed`
    )
    await tap.equal(
      error.details.requestUrl,
      `/notebooks/${notebook.shortId}/collaborators/${
        collaboratorObject.shortId
      }`
    )
  })

  await tap.test('Try to delete a collaborator by a stranger', async () => {
    const res = await request(app)
      .delete(
        `/notebooks/${notebook.shortId}/collaborators/${
          collaboratorObject.shortId
        }`
      )
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token3}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 403)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 403)
    await tap.equal(error.error, 'Forbidden')
    await tap.equal(
      error.message,
      `Access to Collaborator ${collaboratorObject.shortId} disallowed`
    )
    await tap.equal(
      error.details.requestUrl,
      `/notebooks/${notebook.shortId}/collaborators/${
        collaboratorObject.shortId
      }`
    )
  })

  await tap.test('Try to get a notebook as a stranger', async () => {
    const res = await request(app)
      .get(`/notebooks/${notebook.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token3}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 403)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 403)
    await tap.equal(error.error, 'Forbidden')
    await tap.equal(
      error.message,
      `Access to Notebook ${notebook.shortId} disallowed`
    )
    await tap.equal(error.details.requestUrl, `/notebooks/${notebook.shortId}`)
  })

  await tap.test('Try to get a notebook as a pendingCollab', async () => {
    const res = await request(app)
      .get(`/notebooks/${notebook.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token4}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 403)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 403)
    await tap.equal(error.error, 'Forbidden')
    await tap.equal(
      error.message,
      `Access to Notebook ${notebook.shortId} disallowed`
    )
    await tap.equal(error.details.requestUrl, `/notebooks/${notebook.shortId}`)
  })

  await tap.test(
    'Try to get a notebook as a collaborator without a read permission',
    async () => {
      const res = await request(app)
        .get(`/notebooks/${notebook.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token5}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Notebook ${notebook.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook.shortId}`
      )
    }
  )

  await tap.test(
    'Try to get a note inside a notebook as a stranger',
    async () => {
      const res = await request(app)
        .get(`/notes/${note.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token3}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to note ${note.shortId} disallowed`
      )
      await tap.equal(error.details.requestUrl, `/notes/${note.shortId}`)
    }
  )

  await tap.test(
    'Try to get a note inside a notebook as a pending collaborator',
    async () => {
      const res = await request(app)
        .get(`/notes/${note.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token4}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to note ${note.shortId} disallowed`
      )
      await tap.equal(error.details.requestUrl, `/notes/${note.shortId}`)
    }
  )

  await tap.test(
    'Try to get a note inside a notebook as a collaborator without a read permission',
    async () => {
      const res = await request(app)
        .get(`/notes/${note.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token5}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to note ${note.shortId} disallowed`
      )
      await tap.equal(error.details.requestUrl, `/notes/${note.shortId}`)
    }
  )

  await tap.test(
    'Try to get a source inside a notebook as a stranger',
    async () => {
      const res = await request(app)
        .get(`/sources/${source.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token3}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to source ${source.shortId} disallowed`
      )
      await tap.equal(error.details.requestUrl, `/sources/${source.shortId}`)
    }
  )

  await tap.test(
    'Try to get a source inside a notebook as a pending collaborator',
    async () => {
      const res = await request(app)
        .get(`/sources/${source.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token4}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to source ${source.shortId} disallowed`
      )
      await tap.equal(error.details.requestUrl, `/sources/${source.shortId}`)
    }
  )

  await tap.test(
    'Try to get a source inside a notebook as a collaborator without read permission',
    async () => {
      const res = await request(app)
        .get(`/sources/${source.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token5}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to source ${source.shortId} disallowed`
      )
      await tap.equal(error.details.requestUrl, `/sources/${source.shortId}`)
    }
  )

  await tap.test(
    'Try to get a noteContext inside a notebook as a stranger',
    async () => {
      const res = await request(app)
        .get(`/noteContexts/${noteContext.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token3}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to NoteContext ${noteContext.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteContexts/${noteContext.shortId}`
      )
    }
  )

  await tap.test(
    'Try to get a noteContext inside a notebook as a pending collaborator',
    async () => {
      const res = await request(app)
        .get(`/noteContexts/${noteContext.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token4}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to NoteContext ${noteContext.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteContexts/${noteContext.shortId}`
      )
    }
  )

  await tap.test(
    `Try to get a noteContext inside a notebook as a collaborator without
     read permission`,
    async () => {
      const res = await request(app)
        .get(`/noteContexts/${noteContext.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token5}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to NoteContext ${noteContext.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteContexts/${noteContext.shortId}`
      )
    }
  )

  await tap.test(
    'Try to get an outline inside a notebook as a stranger',
    async () => {
      const res = await request(app)
        .get(`/outlines/${outline.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token3}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Outline ${outline.shortId} disallowed`
      )
      await tap.equal(error.details.requestUrl, `/outlines/${outline.shortId}`)
    }
  )

  await tap.test(
    'Try to get an outline inside a notebook as a pending collaborator',
    async () => {
      const res = await request(app)
        .get(`/outlines/${outline.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token4}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Outline ${outline.shortId} disallowed`
      )
      await tap.equal(error.details.requestUrl, `/outlines/${outline.shortId}`)
    }
  )

  await tap.test(
    `Try to get an outline inside a notebook as a collaborator without a
     read permission`,
    async () => {
      const res = await request(app)
        .get(`/outlines/${outline.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token5}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Outline ${outline.shortId} disallowed`
      )
      await tap.equal(error.details.requestUrl, `/outlines/${outline.shortId}`)
    }
  )

  await tap.test(
    'Try to get a note inside a noteContext in a notebook as a stranger',
    async () => {
      const res = await request(app)
        .get(`/notes/${note1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token3}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to note ${note1.shortId} disallowed`
      )
      await tap.equal(error.details.requestUrl, `/notes/${note1.shortId}`)
    }
  )

  await tap.test(
    'Try to get a note inside a noteContext in a notebook as a pending collaborator',
    async () => {
      const res = await request(app)
        .get(`/notes/${note1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token4}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to note ${note1.shortId} disallowed`
      )
      await tap.equal(error.details.requestUrl, `/notes/${note1.shortId}`)
    }
  )

  await tap.test(
    `Try to get a note inside a noteContext in a notebook as a collaborator 
    without read permission`,
    async () => {
      const res = await request(app)
        .get(`/notes/${note1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token5}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to note ${note1.shortId} disallowed`
      )
      await tap.equal(error.details.requestUrl, `/notes/${note1.shortId}`)
    }
  )

  await tap.test(
    'Try to get a note inside an outline in a notebook as a stranger',
    async () => {
      const res = await request(app)
        .get(`/notes/${note2.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token3}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to note ${note2.shortId} disallowed`
      )
      await tap.equal(error.details.requestUrl, `/notes/${note2.shortId}`)
    }
  )

  await tap.test(
    'Try to get a note inside an outline in a notebook as a pending collaborator',
    async () => {
      const res = await request(app)
        .get(`/notes/${note2.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token4}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to note ${note2.shortId} disallowed`
      )
      await tap.equal(error.details.requestUrl, `/notes/${note2.shortId}`)
    }
  )

  await tap.test(
    `Try to get a note inside an outline in a notebook as a collaborator without
     read permission`,
    async () => {
      const res = await request(app)
        .get(`/notes/${note2.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token5}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to note ${note2.shortId} disallowed`
      )
      await tap.equal(error.details.requestUrl, `/notes/${note2.shortId}`)
    }
  )

  await destroyDB(app)
}

module.exports = test
