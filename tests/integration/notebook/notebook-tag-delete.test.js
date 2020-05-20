const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createTag,
  createNotebook,
  addTagToNotebook
} = require('../../utils/testUtils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const tag = await createTag(app, token)
  const tagId = tag.id

  const notebook = await createNotebook(app, token)
  const notebookId = notebook.shortId

  await addTagToNotebook(app, token, tagId, notebookId)

  await tap.test('Remove tag from Notebook', async () => {
    const res = await request(app)
      .delete(`/notebooks/${notebookId}/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)

    // make sure the tag is no longer attached to the notebook
    const tagres = await request(app)
      .get(`/notebooks/${notebookId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(tagres.status, 200)
    const body = tagres.body
    await tap.ok(Array.isArray(body.tags))
    await tap.equal(body.tags.length, 0)
  })

  await tap.test(
    'Try to remove tag from notebook with invalid notebook',
    async () => {
      const res = await request(app)
        .delete(`/notebooks/${notebookId}abc/tags/${tagId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `Remove Tag from Notebook Error: No Relation found between Notebook ${notebookId}abc and Tag ${tagId}`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebookId}abc/tags/${tagId}`
      )
    }
  )

  await tap.test(
    'Try to remove tag from notebook with invalid tag',
    async () => {
      const res = await request(app)
        .delete(`/notebooks/${notebookId}/tags/${tagId}abc`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `Remove Tag from Notebook Error: No Relation found between Notebook ${notebookId} and Tag ${tagId}abc`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebookId}/tags/${tagId}abc`
      )
    }
  )

  await destroyDB(app)
}

module.exports = test
