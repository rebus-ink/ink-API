const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createTag
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerId = urlToId(readerCompleteUrl)

  const publication = await createPublication(readerId)
  const publicationId = urlToId(publication.id)

  const invalidTagId = `${readerId}-123` // including readerId to avoid 403 error
  const invalidPubId = `${readerId}-456`

  // create Tag
  const tag = await createTag(app, token, {
    tagType: 'reader:Stack',
    name: 'mystack',
    json: { property: 'value' }
  })
  const tagId = urlToId(tag.id)

  await tap.test('Assign Publication to Tag', async () => {
    const res = await request(app)
      .put(`/publications/${publicationId}/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)

    // make sure the tag is really attached to the publication
    const pubres = await request(app)
      .get(`/publications/${urlToId(publication.id)}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(pubres.status, 200)
    const body = pubres.body
    await tap.ok(Array.isArray(body.tags))
    await tap.equal(body.tags.length, 1)
  })

  await tap.test(
    'Try to assign Publication to Tag with invalid Tag',
    async () => {
      const res = await request(app)
        .put(`/publications/${publicationId}/tags/${invalidTagId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `Add Tag to Publication Error: No Tag found with id ${invalidTagId}`
      )
      await tap.equal(
        error.details.requestUrl,
        `/publications/${publicationId}/tags/${invalidTagId}`
      )
    }
  )

  await tap.test(
    'Try to assign Publication to Tag with invalid Publication',
    async () => {
      const res = await request(app)
        .put(`/publications/${invalidPubId}/tags/${tagId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(
        error.message,
        `Add Tag to Publication Error: No Publication found with id ${invalidPubId}`
      )
      await tap.equal(
        error.details.requestUrl,
        `/publications/${invalidPubId}/tags/${tagId}`
      )
    }
  )

  await tap.test('Remove Tag from Publication', async () => {
    // before:
    const pubresbefore = await request(app)
      .get(`/publications/${urlToId(publication.id)}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(pubresbefore.status, 200)
    const bodybefore = pubresbefore.body
    await tap.ok(Array.isArray(bodybefore.tags))
    await tap.equal(bodybefore.tags.length, 1)

    const res = await request(app)
      .delete(`/publications/${publicationId}/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)

    // after:
    const pubres = await request(app)
      .get(`/publications/${publicationId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(pubres.status, 200)
    const body = pubres.body
    await tap.ok(Array.isArray(body.tags))
    await tap.equal(body.tags.length, 0)
  })

  await tap.test(
    'Try to remove a Tag from a Publication with invalid Tag',
    async () => {
      const res = await request(app)
        .delete(`/publications/${publicationId}/tags/${invalidTagId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(
        error.message,
        `Remove Tag from Publication Error: No Relation found between Tag ${invalidTagId} and Publication ${publicationId}`
      )
      await tap.equal(
        error.details.requestUrl,
        `/publications/${publicationId}/tags/${invalidTagId}`
      )
    }
  )

  await tap.test(
    'Try to remove a Tag from a Publication with invalid Publication',
    async () => {
      const res = await request(app)
        .delete(`/publications/${invalidPubId}/tags/${tagId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(
        error.message,
        `Remove Tag from Publication Error: No Relation found between Tag ${tagId} and Publication ${invalidPubId}`
      )
      await tap.equal(
        error.details.requestUrl,
        `/publications/${invalidPubId}/tags/${tagId}`
      )
    }
  )

  await tap.test('Try to assign Publication to Tag twice', async () => {
    await request(app)
      .put(`/publications/${publicationId}/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const res = await request(app)
      .put(`/publications/${publicationId}/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `Add Tag to Publication Error: Relationship already exists between Publication ${publicationId} and Tag ${tagId}`
    )
    await tap.equal(
      error.details.requestUrl,
      `/publications/${publicationId}/tags/${tagId}`
    )
  })

  await destroyDB(app)
}

module.exports = test
