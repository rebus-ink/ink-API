const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createNote,
  createDocument,
  createTag
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
  const reader1 = await Reader.createReader(readerId, person)

  const publication = await createPublication(readerId)

  // Create a Document for that publication
  const documentObject = {
    mediaType: 'txt',
    url: 'http://google-bucket/somewhere/file1234.txt',
    documentPath: 'inside/the/book.txt',
    json: { property1: 'value1' }
  }
  const document = await createDocument(
    reader1.id,
    publication.id,
    documentObject
  )

  const documentUrl = `${publication.id}/${document.documentPath}`

  // create Note for reader 1
  const note = await createNote(app, token, readerId, {
    documentUrl,
    publicationId: publication.id,
    body: { motivation: 'test' }
  })
  const noteId = urlToId(note.id)

  // create Tag
  const tag = await createTag(app, token, {
    type: 'stack',
    name: 'mystack',
    json: { property: 'value' }
  })
  const tagId = tag.id

  await tap.test('Assign Note to Tag', async () => {
    const res = await request(app)
      .put(`/notes/${noteId}/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)

    // make sure the tag is really attached to the note
    const tagsForNotes = await request(app)
      .get(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(tagsForNotes.status, 200)
    const body = tagsForNotes.body
    await tap.ok(Array.isArray(body.tags))
    await tap.equal(body.tags.length, 1)
    await tap.equal(body.tags[0].type, 'stack')
    await tap.equal(body.tags[0].name, 'mystack')
  })

  await tap.test(
    'Try to assign the same tag to the same note again',
    async () => {
      const res = await request(app)
        .put(`/notes/${noteId}/tags/${tagId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `Add Tag To Note Error: Tag ${tagId} is already assigned to Note ${noteId}`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notes/${noteId}/tags/${tagId}`
      )
    }
  )

  await tap.test('Try to assign Note to invalid Tag', async () => {
    const res = await request(app)
      .put(`/notes/${noteId}/tags/${tagId}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(
      error.message,
      `Add Tag to Note Error: No Tag found with id ${tagId}abc`
    )
    await tap.equal(
      error.details.requestUrl,
      `/notes/${noteId}/tags/${tagId}abc`
    )
  })

  await tap.test('Try to assign Note to Tag with invalid Note', async () => {
    const res = await request(app)
      .put(`/notes/${noteId}abc/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `Add Tag to Note Error: No Note found with id ${noteId}abc`
    )
    await tap.equal(
      error.details.requestUrl,
      `/notes/${noteId}abc/tags/${tagId}`
    )
  })

  await destroyDB(app)
}

module.exports = test
