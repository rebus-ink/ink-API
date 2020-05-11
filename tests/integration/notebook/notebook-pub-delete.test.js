const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createNotebook,
  addPubToNotebook
} = require('../../utils/testUtils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const publication = await createPublication(app, token)
  const publicationId = publication.shortId

  const notebook = await createNotebook(app, token)
  const notebookId = notebook.shortId

  await addPubToNotebook(app, token, publicationId, notebookId)

  await tap.test('Remove publication from Notebook', async () => {
    const res = await request(app)
      .delete(`/notebooks/${notebookId}/publications/${publicationId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)

    // make sure the publication is no longer attached to the notebook
    const pubres = await request(app)
      .get(`/notebooks/${notebookId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(pubres.status, 200)
    const body = pubres.body
    await tap.ok(Array.isArray(body.publications))
    await tap.equal(body.publications.length, 0)
  })

  await tap.test(
    'Try to remove pub from notebook with invalid notebook',
    async () => {
      const res = await request(app)
        .delete(`/notebooks/${notebookId}abc/publications/${publicationId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `Remove Publication from Notebook Error: No Relation found between Notebook ${notebookId}abc and Publication ${publicationId}`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebookId}abc/publications/${publicationId}`
      )
    }
  )

  await tap.test(
    'Try to remove pub from notebook with invalid pub',
    async () => {
      const res = await request(app)
        .delete(`/notebooks/${notebookId}/publications/${publicationId}abc`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `Remove Publication from Notebook Error: No Relation found between Notebook ${notebookId} and Publication ${publicationId}abc`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebookId}/publications/${publicationId}abc`
      )
    }
  )

  await destroyDB(app)
}

module.exports = test
