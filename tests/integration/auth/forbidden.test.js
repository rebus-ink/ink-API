const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createNote,
  createTag,
  createNoteRelation,
  createNoteContext
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
  const publicationId = urlToId(publication.id)

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

  // create noteRelation for reader1
  const noteRelation1 = await createNoteRelation(app, token, {
    type: 'test',
    from: noteId,
    to: noteId
  })
  // and reader2
  const noteRelation2 = await createNoteRelation(app, token2, {
    type: 'test',
    from: noteId2,
    to: noteId2
  })

  // create noteContexts
  const noteContext1 = await createNoteContext(app, token, { type: 'test' })
  const noteContext2 = await createNoteContext(app, token2, { type: 'test' })

  // ------------------------ PUBLICATION -------------------------------------
  await tap.test(
    'Try to get publication belonging to another reader',
    async () => {
      const res = await request(app)
        .get(`/publications/${publicationId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to publication ${publicationId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/publications/${publicationId}`
      )
    }
  )

  await tap.test(
    'Try to delete a publication belonging to another user',
    async () => {
      const res = await request(app)
        .delete(`/publications/${publicationId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to publication ${publicationId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/publications/${publicationId}`
      )
    }
  )

  await tap.test(
    'Try to update a publication belonging to another user',
    async () => {
      const res = await request(app)
        .patch(`/publications/${publicationId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to publication ${publicationId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/publications/${publicationId}`
      )
    }
  )

  // --------------------------------------- NOTE ----------------------------

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
    await tap.equal(error.message, `Access to note ${noteId} disallowed`)
    await tap.equal(error.details.requestUrl, `/notes/${noteId}`)
  })

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
    await tap.equal(error.message, `Access to Note ${noteId} disallowed`)
    await tap.equal(error.details.requestUrl, `/notes/${noteId}`)
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
    await tap.equal(error.message, `Access to Note ${noteId} disallowed`)
    await tap.equal(error.details.requestUrl, `/notes/${noteId}`)
  })

  // --------------------------------------- NOTERELATION ---------------------------------

  // CREATE

  await tap.test(
    'Try to create a noteRelation with a note belonging to another user (from)',
    async () => {
      const res = await request(app)
        .post(`/noteRelations`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(JSON.stringify({ type: 'test2', from: noteId, to: noteId2 }))

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Note in 'from' property disallowed: ${noteId}`
      )
      await tap.equal(error.details.requestUrl, `/noteRelations`)
    }
  )

  await tap.test(
    'Try to create a noteRelation with a note belonging to another user (to)',
    async () => {
      const res = await request(app)
        .post(`/noteRelations`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(JSON.stringify({ type: 'test2', from: noteId2, to: noteId }))

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Note in 'to' property disallowed: ${noteId}`
      )
      await tap.equal(error.details.requestUrl, `/noteRelations`)
    }
  )

  // UPDATE

  await tap.test(
    'Try to update a noteRelation belonging to another user',
    async () => {
      const res = await request(app)
        .put(`/noteRelations/${noteRelation1.id}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(JSON.stringify({ type: 'test2', from: noteId2 }))

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to NoteRelation ${noteRelation1.id} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteRelations/${noteRelation1.id}`
      )
    }
  )

  await tap.test(
    'Try to update a noteRelation with a note belonging to another user (from)',
    async () => {
      const res = await request(app)
        .put(`/noteRelations/${noteRelation2.id}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(JSON.stringify({ type: 'test2', from: noteId }))

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Note in 'from' property disallowed: ${noteId}`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteRelations/${noteRelation2.id}`
      )
    }
  )

  await tap.test(
    'Try to update a noteRelation with a note belonging to another user (to)',
    async () => {
      const res = await request(app)
        .put(`/noteRelations/${noteRelation2.id}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(JSON.stringify({ type: 'test2', from: noteId2, to: noteId }))

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Note in 'to' property disallowed: ${noteId}`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteRelations/${noteRelation2.id}`
      )
    }
  )

  await tap.test(
    'Try to update a noteRelation with link to another noteRelation belonging to another user (previous)',
    async () => {
      const res = await request(app)
        .put(`/noteRelations/${noteRelation2.id}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            type: 'test2',
            from: noteId2,
            previous: noteRelation1.id
          })
        )

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to NoteRelation in 'previous' property disallowed: ${
          noteRelation1.id
        }`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteRelations/${noteRelation2.id}`
      )
    }
  )

  await tap.test(
    'Try to update a noteRelation with link to another noteRelation belonging to another user (next)',
    async () => {
      const res = await request(app)
        .put(`/noteRelations/${noteRelation2.id}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            type: 'test2',
            from: noteId2,
            next: noteRelation1.id
          })
        )

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to NoteRelation in 'next' property disallowed: ${
          noteRelation1.id
        }`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteRelations/${noteRelation2.id}`
      )
    }
  )

  // DELETE
  await tap.test(
    'Try to delete a noteRelation belonging to another user',
    async () => {
      const res = await request(app)
        .delete(`/noteRelations/${noteRelation1.id}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(JSON.stringify({ type: 'test2', from: noteId2 }))

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to NoteRelation ${noteRelation1.id} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteRelations/${noteRelation1.id}`
      )
    }
  )

  // ------------------------------------- NOTECONTEXT -----------------------

  await tap.test(
    'Try to update a noteContext belonging to another user',
    async () => {
      const res = await request(app)
        .put(`/noteContexts/${noteContext1.id}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(JSON.stringify({ type: 'test2' }))

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to NoteContext ${noteContext1.id} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteContexts/${noteContext1.id}`
      )
    }
  )

  await tap.test(
    'Try to delete a noteContext belonging to another user',
    async () => {
      const res = await request(app)
        .delete(`/noteContexts/${noteContext1.id}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to NoteContext ${noteContext1.id} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteContexts/${noteContext1.id}`
      )
    }
  )

  await tap.test(
    'Try to add a note to a noteContext belonging to another user',
    async () => {
      const res = await request(app)
        .post(`/noteContexts/${noteContext1.id}/notes`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(JSON.stringify({ body: { motivation: 'test' } }))

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to NoteContext ${noteContext1.id} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteContexts/${noteContext1.id}/notes`
      )
    }
  )

  await tap.test(
    'Try to copy a note belonging to another user to a noteContext',
    async () => {
      const res = await request(app)
        .post(`/noteContexts/${noteContext2.id}/notes?source=${noteId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.message, `Access to Note ${noteId} disallowed`)
      await tap.equal(
        error.details.requestUrl,
        `/noteContexts/${noteContext2.id}/notes?source=${noteId}`
      )
    }
  )

  await tap.test(
    'Try to get a NoteContext belonging to another user',
    async () => {
      const res = await request(app)
        .get(`/noteContexts/${noteContext1.id}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to NoteContext ${noteContext1.id} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteContexts/${noteContext1.id}`
      )
    }
  )

  // ---------------------------------------- READER --------------------------

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
      await tap.equal(error.message, `Access to reader ${readerId} disallowed`)
      await tap.equal(error.details.requestUrl, `/readers/${readerId}`)
    }
  )

  // ------------------------------------------- TAG -------------------------------

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
    await tap.equal(error.message, `Access to tag ${tagId} disallowed`)
    await tap.equal(error.details.requestUrl, `/tags/${tagId}`)
  })

  await tap.test('Try to update a tag belonging to another user', async () => {
    const res = await request(app)
      .put(`/tags/${tagId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 403)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 403)
    await tap.equal(error.error, 'Forbidden')
    await tap.equal(error.message, `Access to tag ${tagId} disallowed`)
    await tap.equal(error.details.requestUrl, `/tags/${tagId}`)
  })

  // ------------------------------------- TAG - PUBLICATION ---------------------------

  await tap.test(
    'Try to assign a tag to a publication belonging to another user',
    async () => {
      const res = await request(app)
        .put(`/publications/${publicationId}/tags/${tagId2}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Publication ${publicationId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/publications/${publicationId}/tags/${tagId2}`
      )
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
      await tap.equal(error.message, `Access to Tag ${tagId} disallowed`)
      await tap.equal(
        error.details.requestUrl,
        `/publications/${publicationId2}/tags/${tagId}`
      )
    }
  )

  await tap.test(
    'Try to remove a tag from a publication belonging to another user',
    async () => {
      const res = await request(app)
        .delete(`/publications/${publicationId}/tags/${tagId2}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Publication ${publicationId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/publications/${publicationId}/tags/${tagId2}`
      )
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
      await tap.equal(error.message, `Access to Tag ${tagId} disallowed`)
      await tap.equal(
        error.details.requestUrl,
        `/publications/${publicationId2}/tags/${tagId}`
      )
    }
  )

  // ---------------------------------------- TAG - NOTE ---------------------------

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
      await tap.equal(error.message, `Access to Note ${noteId} disallowed`)
      await tap.equal(
        error.details.requestUrl,
        `/notes/${noteId}/tags/${tagId2}`
      )
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
      await tap.equal(error.message, `Access to Tag ${tagId} disallowed`)
      await tap.equal(
        error.details.requestUrl,
        `/notes/${noteId2}/tags/${tagId}`
      )
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
      await tap.equal(error.message, `Access to Note ${noteId} disallowed`)
      await tap.equal(
        error.details.requestUrl,
        `/notes/${noteId}/tags/${tagId2}`
      )
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
      await tap.equal(error.message, `Access to Tag ${tagId} disallowed`)
      await tap.equal(
        error.details.requestUrl,
        `/notes/${noteId2}/tags/${tagId}`
      )
    }
  )

  // -------------------------------------- UPLOADS -------------------------------

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
      // await tap.equal(error.details.type, 'Reader')
      // await tap.type(error.details.id, 'string')
      // await tap.equal(error.details.activity, 'Upload File')
    }
  )

  // ----------------------------------- READACTIVITY ---------------------------

  await tap.test(
    'Try to create a readActivity for a publication belonging to another user',
    async () => {
      const res = await request(app)
        .post(`/publications/${publicationId}/readActivity`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(JSON.stringify({ selector: { property: 'something' } }))

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to publication ${publicationId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/publications/${publicationId}/readActivity`
      )
    }
  )

  await destroyDB(app)
}

module.exports = test
