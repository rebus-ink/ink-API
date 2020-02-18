const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNoteContext
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerUrl = await createUser(app, token)
  const readerId = urlToId(readerUrl)

  const noteContext = await createNoteContext(app, token)

  await tap.test('Delete a NoteContext', async () => {
    const res = await request(app)
      .delete(`/noteContexts/${noteContext.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)
  })

  await tap.test(
    'Try to delete a NoteContext that was already deleted',
    async () => {
      const res = await request(app)
        .delete(`/noteContexts/${noteContext.id}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `No NoteContext found with id ${noteContext.id}`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteContexts/${noteContext.id}`
      )
    }
  )

  await tap.test(
    'Try to delete a NoteContext that does not exist',
    async () => {
      const res = await request(app)
        .delete(`/noteContexts/${noteContext.id}abc`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `No NoteContext found with id ${noteContext.id}abc`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteContexts/${noteContext.id}abc`
      )
    }
  )

  await tap.test('Try to update a noteContext that was deleted', async () => {
    const res = await request(app)
      .put(`/noteContexts/${noteContext.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(Object.assign(noteContext, { type: 'test2' })))

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `No NoteContext found with id ${noteContext.id}`
    )
    await tap.equal(error.details.requestUrl, `/noteContexts/${noteContext.id}`)
  })

  await destroyDB(app)
}

module.exports = test
