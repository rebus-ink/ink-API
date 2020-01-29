const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createNote,
  createTag
} = require('../../utils/testUtils')
const { Reader } = require('../../../models/Reader')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  // reader1
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerId = urlToId(readerCompleteUrl)

  // Create Reader object
  const person = {
    name: 'J. Random Reader'
  }

  await Reader.createReader(readerId, person)

  // reader2
  const token2 = getToken()
  const readerCompleteUrl2 = await createUser(app, token2)
  const readerUrl2 = urlparse(readerCompleteUrl2).path
  const readerId2 = urlToId(readerCompleteUrl2)

  // create publication and tag for reader 1
  const publication = await createPublication(readerId)
  const publicationUrl = publication.id

  const tag = await createTag(app, token)
  const tagId = urlToId(tag.id)

  // create publication and tag for reader 2
  const publication2 = await createPublication(readerId2)
  publicationId2 = urlToId(publication2.id)

  const tag2 = await createTag(app, token2, readerUrl2)
  const tagId2 = urlToId(tag2.id)

  // create Note for reader 1
  const note = await createNote(app, token, readerId, {
    body: { motivation: 'test' }
  })
  const noteId = urlToId(note.id)

  // create Note for reader 2
  const note2 = await createNote(app, token2, readerId2, {
    body: { motivation: 'test' }
  })
  const noteId2 = urlToId(note2.id)

  await tap.test(
    'Try to get publication belonging to another reader',
    async () => {
      const res = await request(app)
        .get(`/publications/${urlToId(publicationUrl)}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.details.type, 'Publication')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Get Publication')
    }
  )

  await tap.test('Try to get note belonging to another reader', async () => {
    const res = await request(app)
      .get(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 403)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 403)
    await tap.equal(error.error, 'Forbidden')
    await tap.equal(error.details.type, 'Note')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Get Note')
  })

  await tap.test(
    'Try to get reader object belonging to another reader',
    async () => {
      const res = await request(app)
        .get(`/readers/${readerId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.details.type, 'Reader')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Get Reader')
    }
  )

  await tap.test(
    'Try to delete a publication belonging to another user',
    async () => {
      const res = await request(app)
        .delete(`/publications/${urlToId(publicationUrl)}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.details.type, 'Publication')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Delete Publication')
    }
  )

  await tap.test(
    'Try to update a publication belonging to another user',
    async () => {
      const res = await request(app)
        .patch(`/publications/${urlToId(publicationUrl)}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.details.type, 'Publication')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Update Publication')
    }
  )

  await tap.test('Try to delete a note belonging to another user', async () => {
    const res = await request(app)
      .delete(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 403)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 403)
    await tap.equal(error.error, 'Forbidden')
    await tap.equal(error.details.type, 'Note')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Delete Note')
  })

  await tap.test('Try to update a note belonging to another user', async () => {
    const res = await request(app)
      .put(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 403)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 403)
    await tap.equal(error.error, 'Forbidden')
    await tap.equal(error.details.type, 'Note')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Update Note')
  })

  await tap.test('Try to delete a tag belonging to another user', async () => {
    const res = await request(app)
      .delete(`/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 403)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 403)
    await tap.equal(error.error, 'Forbidden')
    await tap.equal(error.details.type, 'Tag')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Delete Tag')
  })

  await tap.test('Try to update a tag belonging to another user', async () => {
    const res = await request(app)
      .patch(`/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 403)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 403)
    await tap.equal(error.error, 'Forbidden')
    await tap.equal(error.details.type, 'Tag')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Update Tag')
  })

  await tap.test(
    'Try to assign a tag to a publication belonging to another user',
    async () => {
      const res = await request(app)
        .put(`/publications/${urlToId(publicationUrl)}/tags/${tagId2}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.details.type, 'Publication')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Add Tag to Publication')
    }
  )

  await tap.test(
    'Try to assign a tag belonging to another user to a publication',
    async () => {
      const res = await request(app)
        .put(`/publications/${publicationId2}/tags/${tagId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.details.type, 'Tag')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Add Tag to Publication')
    }
  )

  await tap.test(
    'Try to remove a tag from a publication belonging to another user',
    async () => {
      const res = await request(app)
        .delete(`/publications/${urlToId(publicationUrl)}/tags/${tagId2}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.details.type, 'Publication')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Remove Tag from Publication')
    }
  )

  await tap.test(
    'Try to remove a tag belonging to another user from a publication',
    async () => {
      const res = await request(app)
        .delete(`/publications/${publicationId2}/tags/${tagId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.details.type, 'Tag')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Remove Tag from Publication')
    }
  )

  await tap.test(
    'Try to assign a tag to a note belonging to another user',
    async () => {
      const res = await request(app)
        .put(`/notes/${noteId}/tags/${tagId2}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.details.type, 'Note')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Add Tag to Note')
    }
  )

  await tap.test(
    'Try to assign a tag belonging to another user to a note',
    async () => {
      const res = await request(app)
        .put(`/notes/${noteId2}/tags/${tagId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.details.type, 'Tag')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Add Tag to Note')
    }
  )

  await tap.test(
    'Try to remove a tag from a note belonging to another user',
    async () => {
      const res = await request(app)
        .delete(`/notes/${noteId}/tags/${tagId2}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.details.type, 'Note')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Remove Tag from Note')
    }
  )

  await tap.test(
    'Try to remove a tag belonging to another user from a note',
    async () => {
      const res = await request(app)
        .delete(`/notes/${noteId2}/tags/${tagId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.details.type, 'Tag')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Remove Tag from Note')
    }
  )

  await tap.test(
    'Try to upload files to a folder belonging to another reader',
    async () => {
      const res = await request(app)
        .post(`/reader-${readerId}/file-upload`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .attach('files', 'tests/test-files/test-file3.txt')
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.details.type, 'Reader')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Upload File')
    }
  )

  await tap.test(
    'Try to create a readActivity for a publication belonging to another user',
    async () => {
      const res = await request(app)
        .post(`/publications/${urlToId(publicationUrl)}/readActivity`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(JSON.stringify({ selector: { property: 'something' } }))

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.details.type, 'Publication')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Create ReadActivity')
    }
  )

  await destroyDB(app)
}

module.exports = test
