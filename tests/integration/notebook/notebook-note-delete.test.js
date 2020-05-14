const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNote,
  createNotebook,
  addNoteToNotebook
} = require('../../utils/testUtils')

const test = async app => {
  const token = getToken()
  const reader = await createUser(app, token)

  const note = await createNote(app, token, reader.shortId)
  const noteId = note.shortId

  const notebook = await createNotebook(app, token)
  const notebookId = notebook.shortId

  await addNoteToNotebook(app, token, noteId, notebookId)

  await tap.test('Remove note from Notebook', async () => {
    const res = await request(app)
      .delete(`/notebooks/${notebookId}/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)

    // make sure the note is no longer attached to the notebook
    const noteres = await request(app)
      .get(`/notebooks/${notebookId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(noteres.status, 200)
    const body = noteres.body
    await tap.ok(Array.isArray(body.notes))
    await tap.equal(body.notes.length, 0)
  })

  await tap.test(
    'Try to remove note from notebook with invalid notebook',
    async () => {
      const res = await request(app)
        .delete(`/notebooks/${notebookId}abc/notes/${noteId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `Remove Note from Notebook Error: No Relation found between Notebook ${notebookId}abc and Note ${noteId}`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebookId}abc/notes/${noteId}`
      )
    }
  )

  await tap.test(
    'Try to remove note from notebook with invalid note',
    async () => {
      const res = await request(app)
        .delete(`/notebooks/${notebookId}/notes/${noteId}abc`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `Remove Note from Notebook Error: No Relation found between Notebook ${notebookId} and Note ${noteId}abc`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebookId}/notes/${noteId}abc`
      )
    }
  )

  await destroyDB(app)
}

module.exports = test
