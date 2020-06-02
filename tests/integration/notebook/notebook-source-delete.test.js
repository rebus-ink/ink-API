const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createNotebook,
  addSourceToNotebook
} = require('../../utils/testUtils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const source = await createSource(app, token)
  const sourceId = source.shortId

  const notebook = await createNotebook(app, token)
  const notebookId = notebook.shortId

  await addSourceToNotebook(app, token, sourceId, notebookId)

  await tap.test('Remove source from Notebook', async () => {
    const res = await request(app)
      .delete(`/notebooks/${notebookId}/sources/${sourceId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)

    // make sure the source is no longer attached to the notebook
    const sourceres = await request(app)
      .get(`/notebooks/${notebookId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(sourceres.status, 200)
    const body = sourceres.body
    await tap.ok(Array.isArray(body.sources))
    await tap.equal(body.sources.length, 0)
  })

  await tap.test(
    'Try to remove source from notebook with invalid notebook',
    async () => {
      const res = await request(app)
        .delete(`/notebooks/${notebookId}abc/sources/${sourceId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `Remove Source from Notebook Error: No Relation found between Notebook ${notebookId}abc and Source ${sourceId}`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebookId}abc/sources/${sourceId}`
      )
    }
  )

  await tap.test(
    'Try to remove source from notebook with invalid source',
    async () => {
      const res = await request(app)
        .delete(`/notebooks/${notebookId}/sources/${sourceId}abc`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `Remove Source from Notebook Error: No Relation found between Notebook ${notebookId} and Source ${sourceId}abc`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebookId}/sources/${sourceId}abc`
      )
    }
  )

  await destroyDB(app)
}

module.exports = test
