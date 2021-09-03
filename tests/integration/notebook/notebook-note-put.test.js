const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNotebook,
  createNote,
  createSource
} = require('../../utils/testUtils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const source = await createSource(app, token)
  const source2 = await createSource(app, token)
  const note = await createNote(app, token, { sourceId: source.shortId })
  const noteId = note.shortId

  const notebook = await createNotebook(app, token)
  const notebookId = notebook.shortId

  await tap.test('Assign Note to Notebook', async () => {
    const res = await request(app)
      .put(`/notebooks/${notebookId}/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)

    // make sure the note is really attached to the notebook
    const pubres = await request(app)
      .get(`/notebooks/${notebookId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(pubres.status, 200)
    const body = pubres.body
    await tap.ok(Array.isArray(body.notes))
    await tap.equal(body.notes.length, 1)
    await tap.equal(body.notes[0].shortId, noteId)
    await tap.ok(body.notes[0].body)
    // the note's source should also now be in the notebook
    await tap.equal(body.sources.length, 1)
  })

  const note2 = await createNote(app, token, { sourceId: source.shortId })
  const noteId2 = note2.shortId
  const note3 = await createNote(app, token, { sourceId: source.shortId })
  const noteId3 = note3.shortId
  const note4 = await createNote(app, token, { sourceId: source2.shortId })
  const noteId4 = note4.shortId
  const note5 = await createNote(app, token)
  const noteId5 = note5.shortId

  await tap.test('Assign Multiple notes to Notebook', async () => {
    const res = await request(app)
      .put(
        `/notebooks/${notebookId}/notes/${noteId2},${noteId3},${noteId4},${noteId5}`
      )
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.status, 204)

    // make sure the note is really attached to the notebook
    const pubres = await request(app)
      .get(`/notebooks/${notebookId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(pubres.status, 200)
    const body = pubres.body
    await tap.ok(Array.isArray(body.notes))
    await tap.equal(body.notes.length, 5)
    await tap.equal(body.sources.length, 2)
  })

  await tap.test('Try to assign Note to an invalid Notebook', async () => {
    const res = await request(app)
      .put(`/notebooks/${notebookId}abc/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `Add Note to Notebook Error: No Notebook found with id ${notebookId}abc`
    )
    await tap.equal(
      error.details.requestUrl,
      `/notebooks/${notebookId}abc/notes/${noteId}`
    )
  })

  await tap.test('Try to assign an invalid Note to a Notebook', async () => {
    const res = await request(app)
      .put(`/notebooks/${notebookId}/notes/${noteId}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `Add Note to Notebook Error: No Note found with id ${noteId}abc`
    )
    await tap.equal(
      error.details.requestUrl,
      `/notebooks/${notebookId}/notes/${noteId}abc`
    )
  })

  await tap.test('Try to assign Note to Notebook twice', async () => {
    const res = await request(app)
      .put(`/notebooks/${notebookId}/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `Add Note to Notebook Error: Relationship already exists between Notebook ${notebookId} and Note ${noteId}`
    )
    await tap.equal(
      error.details.requestUrl,
      `/notebooks/${notebookId}/notes/${noteId}`
    )
  })

  await destroyDB(app)
}

module.exports = test
