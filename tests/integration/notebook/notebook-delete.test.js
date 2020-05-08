const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNotebook
} = require('../../utils/testUtils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const notebook = await createNotebook(app, token)

  await tap.test('Delete a Notebook', async () => {
    const res = await request(app)
      .delete(`/notebooks/${notebook.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)
  })

  await tap.test(
    'Try to delete a Notebook that was already deleted',
    async () => {
      const res = await request(app)
        .delete(`/notebooks/${notebook.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `No Notebook found with id ${notebook.shortId}`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook.shortId}`
      )
    }
  )

  await tap.test('Try to delete a Notebook that does not exist', async () => {
    const res = await request(app)
      .delete(`/notebooks/${notebook.shortId}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `No Notebook found with id ${notebook.shortId}abc`
    )
    await tap.equal(
      error.details.requestUrl,
      `/notebooks/${notebook.shortId}abc`
    )
  })

  await tap.test('Try to get a notebook that was deleted', async () => {
    const res = await request(app)
      .get(`/notebooks/${notebook.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `Get Notebook Error: No Notebook found with id ${notebook.shortId}`
    )
    await tap.equal(error.details.requestUrl, `/notebooks/${notebook.shortId}`)
  })

  await tap.test('Try to update a notebook that was deleted', async () => {
    const res = await request(app)
      .put(`/notebooks/${notebook.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(Object.assign(notebook, { name: 'new name' })))

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `No Notebook found with id ${notebook.shortId}`
    )
    await tap.equal(error.details.requestUrl, `/notebooks/${notebook.shortId}`)
  })

  await destroyDB(app)
}

module.exports = test
