const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNoteContext
} = require('../../utils/testUtils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const noteContext = await createNoteContext(app, token)

  await tap.test('Delete a NoteContext', async () => {
    const res = await request(app)
      .delete(`/noteContexts/${noteContext.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)
  })

  await tap.test(
    'Try to delete a NoteContext that was already deleted',
    async () => {
      const res = await request(app)
        .delete(`/noteContexts/${noteContext.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `No NoteContext found with id ${noteContext.shortId}`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteContexts/${noteContext.shortId}`
      )
    }
  )

  await tap.test(
    'Try to delete a NoteContext that does not exist',
    async () => {
      const res = await request(app)
        .delete(`/noteContexts/${noteContext.shortId}abc`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `No NoteContext found with id ${noteContext.shortId}abc`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteContexts/${noteContext.shortId}abc`
      )
    }
  )

  await tap.test('Try to get a noteContext that was deleted', async () => {
    const res = await request(app)
      .get(`/noteContexts/${noteContext.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `Get NoteContext Error: No NoteContext found with id ${
        noteContext.shortId
      }`
    )
    await tap.equal(
      error.details.requestUrl,
      `/noteContexts/${noteContext.shortId}`
    )
  })

  await tap.test(
    'Try to add a note to a context that was deleted',
    async () => {
      const res = await request(app)
        .post(`/noteContexts/${noteContext.shortId}/notes`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            body: {
              content: 'this is the content of the note',
              motivation: 'test'
            },
            json: { property1: 'value1' }
          })
        )

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `Add Note to Context Error: No Context found with id: ${
          noteContext.shortId
        }`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteContexts/${noteContext.shortId}/notes`
      )
    }
  )

  await tap.test('Try to update a noteContext that was deleted', async () => {
    const res = await request(app)
      .put(`/noteContexts/${noteContext.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(Object.assign(noteContext, { type: 'test2' })))

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `No NoteContext found with id ${noteContext.shortId}`
    )
    await tap.equal(
      error.details.requestUrl,
      `/noteContexts/${noteContext.shortId}`
    )
  })

  await destroyDB(app)
}

module.exports = test
