const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createTag,
  createNotebook
} = require('../../utils/testUtils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const tag = await createTag(app, token)
  const tagId = tag.shortId

  const notebook = await createNotebook(app, token)
  const notebookId = notebook.shortId

  await tap.test('Assign Tag to Notebook', async () => {
    const res = await request(app)
      .put(`/notebooks/${notebookId}/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)

    // make sure the tag is really attached to the notebook
    const tagres = await request(app)
      .get(`/notebooks/${notebookId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(tagres.status, 200)
    const body = tagres.body
    await tap.ok(Array.isArray(body.tags))
    await tap.equal(body.tags.length, 1)
    await tap.equal(body.tags[0].shortId, tagId)
  })

  await tap.test('Try to assign Tag to an invalid Notebook', async () => {
    const res = await request(app)
      .put(`/notebooks/${notebookId}abc/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `Add Tag to Notebook Error: No Notebook found with id ${notebookId}abc`
    )
    await tap.equal(
      error.details.requestUrl,
      `/notebooks/${notebookId}abc/tags/${tagId}`
    )
  })

  await tap.test('Try to assign an invalid Tag to a Notebook', async () => {
    const res = await request(app)
      .put(`/notebooks/${notebookId}/tags/${tagId}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `Add Tag to Notebook Error: No Tag found with id ${tagId}abc`
    )
    await tap.equal(
      error.details.requestUrl,
      `/notebooks/${notebookId}/tags/${tagId}abc`
    )
  })

  await tap.test('Try to assign Tag to Notebook twice', async () => {
    const res = await request(app)
      .put(`/notebooks/${notebookId}/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `Add Tag to Notebook Error: Relationship already exists between Notebook ${notebookId} and Tag ${tagId}`
    )
    await tap.equal(
      error.details.requestUrl,
      `/notebooks/${notebookId}/tags/${tagId}`
    )
  })

  await destroyDB(app)
}

module.exports = test
