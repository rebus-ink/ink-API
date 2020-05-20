const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createNote,
  createTag,
  addNoteToCollection
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')
const { Reader } = require('../../../models/Reader')

const test = async app => {
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerId = urlToId(readerCompleteUrl)

  // Create Reader object
  const person = {
    name: 'J. Random Reader'
  }
  await Reader.createReader(readerId, person)

  const publication = await createPublication(app, token)

  // create Note for reader 1
  const note = await createNote(app, token, {
    publicationId: publication.id
  })
  const noteId = urlToId(note.id)

  // create Tag
  const tag = await createTag(app, token, {
    type: 'stack',
    name: 'mystack',
    json: { property: 'value' }
  })
  const tagId = tag.id

  // assign note to tag
  await addNoteToCollection(app, token, noteId, tagId)

  await tap.test('Remove Tag from Note', async () => {
    // before:
    const response = await request(app)
      .get(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(response.status, 200)
    const bodybefore = response.body
    await tap.ok(Array.isArray(bodybefore.tags))
    await tap.equal(bodybefore.tags.length, 1)

    const res = await request(app)
      .delete(`/notes/${noteId}/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)

    // after
    const noteAfter = await request(app)
      .get(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(noteAfter.status, 200)
    const body = noteAfter.body
    await tap.ok(Array.isArray(body.tags))
    await tap.equal(body.tags.length, 0)
  })

  await tap.test('Try to remove a tag from a note again', async () => {
    const res = await request(app)
      .delete(`/notes/${noteId}/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `Delete Tag from Note Error: No relationship found between Note ${noteId} and Tag ${tagId}`
    )
    await tap.equal(error.details.requestUrl, `/notes/${noteId}/tags/${tagId}`)
  })

  await tap.test(
    'Try to remove a Tag from a Note with invalid Tag',
    async () => {
      const res = await request(app)
        .delete(`/notes/${noteId}/tags/${tagId}123`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `Delete Tag from Note Error: No relationship found between Note ${noteId} and Tag ${tagId}123`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notes/${noteId}/tags/${tagId}123`
      )
    }
  )

  await tap.test(
    'Try to remove a Tag from a Note with invalid Note',
    async () => {
      const res = await request(app)
        .delete(`/notes/${noteId}123/tags/${tagId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `Delete Tag from Note Error: No relationship found between Note ${noteId}123 and Tag ${tagId}`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notes/${noteId}123/tags/${tagId}`
      )
    }
  )

  await destroyDB(app)
}

module.exports = test
