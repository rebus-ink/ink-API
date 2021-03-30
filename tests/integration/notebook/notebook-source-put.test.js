const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createNotebook
} = require('../../utils/testUtils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const source = await createSource(app, token)
  const sourceId = source.shortId

  const notebook = await createNotebook(app, token)
  const notebookId = notebook.shortId

  await tap.test('Assign Source to Notebook', async () => {
    const res = await request(app)
      .put(`/notebooks/${notebookId}/sources/${sourceId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)

    // make sure the source is really attached to the notebook
    const sourceres = await request(app)
      .get(`/notebooks/${notebookId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(sourceres.status, 200)
    const body = sourceres.body
    await tap.ok(Array.isArray(body.sources))
    await tap.equal(body.sources.length, 1)
    await tap.equal(body.sources[0].shortId, sourceId)
  })

  const source2 = await createSource(app, token)
  const sourceId2 = source2.shortId
  const source3 = await createSource(app, token)
  const sourceId3 = source3.shortId

  await tap.test('Assign Multiple Sources to Notebook', async () => {
    const res = await request(app)
      .put(`/notebooks/${notebookId}/sources/${sourceId2},${sourceId3}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)

    // make sure the source is really attached to the notebook
    const sourceres = await request(app)
      .get(`/notebooks/${notebookId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(sourceres.status, 200)
    const body = sourceres.body
    await tap.ok(Array.isArray(body.sources))
    await tap.equal(body.sources.length, 3)
  })

  await tap.test('Try to assign Source to an invalid Notebook', async () => {
    const res = await request(app)
      .put(`/notebooks/${notebookId}abc/sources/${sourceId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `Add Source to Notebook Error: No Notebook found with id ${notebookId}abc`
    )
    await tap.equal(
      error.details.requestUrl,
      `/notebooks/${notebookId}abc/sources/${sourceId}`
    )
  })

  await tap.test('Try to assign an invalid Source to a Notebook', async () => {
    const res = await request(app)
      .put(`/notebooks/${notebookId}/sources/${sourceId}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `Add Source to Notebook Error: No Source found with id ${sourceId}abc`
    )
    await tap.equal(
      error.details.requestUrl,
      `/notebooks/${notebookId}/sources/${sourceId}abc`
    )
  })

  await tap.test('Try to assign Source to Notebook twice', async () => {
    const res = await request(app)
      .put(`/notebooks/${notebookId}/sources/${sourceId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `Add Source to Notebook Error: Relationship already exists between Notebook ${notebookId} and Source ${sourceId}`
    )
    await tap.equal(
      error.details.requestUrl,
      `/notebooks/${notebookId}/sources/${sourceId}`
    )
  })

  await destroyDB(app)
}

module.exports = test
