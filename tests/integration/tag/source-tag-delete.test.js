const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createTag,
  addSourceToCollection
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

  await addSourceToCollection(app, token, sourceId, tagId)

  await tap.test('Remove Tag from Source', async () => {
    // before:
    const sourceresbefore = await request(app)
      .get(`/sources/${urlToId(source.id)}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(sourceresbefore.status, 200)
    const bodybefore = sourceresbefore.body
    await tap.ok(Array.isArray(bodybefore.tags))
    await tap.equal(bodybefore.tags.length, 1)

    const res = await request(app)
      .delete(`/sources/${sourceId}/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)

    // after:
    const sourceres = await request(app)
      .get(`/sources/${sourceId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(sourceres.status, 200)
    const body = sourceres.body
    await tap.ok(Array.isArray(body.tags))
    await tap.equal(body.tags.length, 0)
  })

  await tap.test(
    'Try to remove a Tag from a Source with invalid Tag',
    async () => {
      const res = await request(app)
        .delete(`/sources/${sourceId}/tags/${invalidTagId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(
        error.message,
        `Remove Tag from Source Error: No Relation found between Tag ${invalidTagId} and Source ${sourceId}`
      )
      await tap.equal(
        error.details.requestUrl,
        `/sources/${sourceId}/tags/${invalidTagId}`
      )
    }
  )

  await tap.test(
    'Try to remove a Tag from a Source with invalid Source',
    async () => {
      const res = await request(app)
        .delete(`/sources/${invalidSourceId}/tags/${tagId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(
        error.message,
        `Remove Tag from Source Error: No Relation found between Tag ${tagId} and Source ${invalidSourceId}`
      )
      await tap.equal(
        error.details.requestUrl,
        `/sources/${invalidSourceId}/tags/${tagId}`
      )
    }
  )

  await destroyDB(app)
}

module.exports = test
