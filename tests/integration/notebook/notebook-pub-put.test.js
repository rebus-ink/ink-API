const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createNotebook
} = require('../../utils/testUtils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const publication = await createPublication(app, token)
  const publicationId = publication.shortId

  const notebook = await createNotebook(app, token)
  const notebookId = notebook.shortId

  await tap.test('Assign Publication to Notebook', async () => {
    const res = await request(app)
      .put(`/notebooks/${notebookId}/publications/${publicationId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)

    // make sure the publication is really attached to the notebook
    const pubres = await request(app)
      .get(`/notebooks/${notebookId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(pubres.status, 200)
    const body = pubres.body
    await tap.ok(Array.isArray(body.publications))
    await tap.equal(body.publications.length, 1)
    await tap.equal(body.publications[0].shortId, publicationId)
  })

  await tap.test(
    'Try to assign Publication to an invalid Notebook',
    async () => {
      const res = await request(app)
        .put(`/notebooks/${notebookId}abc/publications/${publicationId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `Add Publication to Notebook Error: No Notebook found with id ${notebookId}abc`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebookId}abc/publications/${publicationId}`
      )
    }
  )

  await tap.test(
    'Try to assign an invalid Publication to a Notebook',
    async () => {
      const res = await request(app)
        .put(`/notebooks/${notebookId}/publications/${publicationId}abc`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `Add Publication to Notebook Error: No Publication found with id ${publicationId}abc`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebookId}/publications/${publicationId}abc`
      )
    }
  )

  await tap.test('Try to assign Publication to Notebook twice', async () => {
    const res = await request(app)
      .put(`/notebooks/${notebookId}/publications/${publicationId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `Add Publication to Notebook Error: Relationship already exists between Notebook ${notebookId} and Publication ${publicationId}`
    )
    await tap.equal(
      error.details.requestUrl,
      `/notebooks/${notebookId}/publications/${publicationId}`
    )
  })

  await destroyDB(app)
}

module.exports = test
