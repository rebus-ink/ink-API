const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createTag
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerId = urlToId(readerCompleteUrl)

  const source = await createSource(app, token)
  const sourceId = urlToId(source.id)

  const invalidTagId = `${readerId}-123` // including readerId to avoid 403 error
  const invalidSourceId = `${readerId}-456`

  // create Tag
  const tag = await createTag(app, token, {
    type: 'stack',
    name: 'mystack',
    json: { property: 'value' }
  })
  const tagId = urlToId(tag.id)

  await tap.test('Assign Source to Tag', async () => {
    const res = await request(app)
      .put(`/sources/${sourceId}/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)

    // make sure the tag is really attached to the source
    const sourceres = await request(app)
      .get(`/sources/${urlToId(source.id)}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(sourceres.status, 200)
    const body = sourceres.body
    await tap.ok(Array.isArray(body.tags))
    await tap.equal(body.tags.length, 1)
  })

  await tap.test('Try to assign Source to Tag with invalid Tag', async () => {
    const res = await request(app)
      .put(`/sources/${sourceId}/tags/${invalidTagId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `Add Tag to Source Error: No Tag found with id ${invalidTagId}`
    )
    await tap.equal(
      error.details.requestUrl,
      `/sources/${sourceId}/tags/${invalidTagId}`
    )
  })

  await tap.test(
    'Try to assign Source to Tag with invalid Source',
    async () => {
      const res = await request(app)
        .put(`/sources/${invalidSourceId}/tags/${tagId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(
        error.message,
        `Add Tag to Source Error: No Source found with id ${invalidSourceId}`
      )
      await tap.equal(
        error.details.requestUrl,
        `/sources/${invalidSourceId}/tags/${tagId}`
      )
    }
  )

  await tap.test('Try to assign Source to Tag twice', async () => {
    await request(app)
      .put(`/sources/${sourceId}/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const res = await request(app)
      .put(`/sources/${sourceId}/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `Add Tag to Source Error: Relationship already exists between Source ${sourceId} and Tag ${tagId}`
    )
    await tap.equal(
      error.details.requestUrl,
      `/sources/${sourceId}/tags/${tagId}`
    )
  })

  await destroyDB(app)
}

module.exports = test
