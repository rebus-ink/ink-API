const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createNote,
  createTag,
  createNoteRelation,
  createNoteContext,
  createNotebook
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

  // create source and tag for reader 1
  const source = await createSource(app, token)
  const sourceId = urlToId(source.id)

  const tag = await createTag(app, token)
  const tagId = urlToId(tag.id)

  // create source and tag for reader 2
  const source2 = await createSource(app, token2)
  sourceId2 = urlToId(source2.id)

  const tag2 = await createTag(app, token2, readerUrl2)
  const tagId2 = urlToId(tag2.id)

  // create Note for reader 1
  const note = await createNote(app, token, {
    body: { motivation: 'test' }
  })
  const noteId = urlToId(note.id)

  // create Note for reader 2
  const note2 = await createNote(app, token2, {
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

  // outlines
  const outline1 = await createNoteContext(app, token, { type: 'outline' })
  const outline2 = await createNoteContext(app, token2, { type: 'outline' })

  const notebook1 = await createNotebook(app, token)
  const notebook2 = await createNotebook(app, token2)

  // ------------------------ SOURCE -------------------------------------
  await tap.test('Try to get source belonging to another reader', async () => {
    const res = await request(app)
      .get(`/sources/${sourceId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token2}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 403)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 403)
    await tap.equal(error.error, 'Forbidden')
    await tap.equal(error.message, `Access to source ${sourceId} disallowed`)
    await tap.equal(error.details.requestUrl, `/sources/${sourceId}`)
  })

  await tap.test(
    'Try to delete a source belonging to another user',
    async () => {
      const res = await request(app)
        .delete(`/sources/${sourceId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.message, `Access to source ${sourceId} disallowed`)
      await tap.equal(error.details.requestUrl, `/sources/${sourceId}`)
    }
  )

  await tap.test(
    'Try to update a source belonging to another user',
    async () => {
      const res = await request(app)
        .patch(`/sources/${sourceId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.message, `Access to source ${sourceId} disallowed`)
      await tap.equal(error.details.requestUrl, `/sources/${sourceId}`)
    }
  )

  // ------------------------ SOURCE BATCH UPDATE -------------------------------------
  await tap.test(
    'Try to batch update a source belonging to another reader',
    async () => {
      // replace
      const res1 = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            operation: 'replace',
            sources: [sourceId],
            property: 'type',
            value: 'Article'
          })
        )

      await tap.equal(res1.statusCode, 207)
      const result1 = res1.body.status
      await tap.equal(result1.length, 1)
      await tap.equal(result1[0].status, 403)
      await tap.equal(
        result1[0].message,
        `Access to source ${sourceId} disallowed`
      )

      // add metadata
      const res2 = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            operation: 'add',
            sources: [sourceId],
            property: 'keywords',
            value: 'something'
          })
        )

      await tap.equal(res2.statusCode, 207)
      const result2 = res2.body.status
      await tap.equal(result2.length, 1)
      await tap.equal(result2[0].status, 403)
      await tap.equal(
        result2[0].message,
        `Access to source ${sourceId} disallowed`
      )

      // remove metadata
      const res3 = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            operation: 'remove',
            sources: [sourceId],
            property: 'keywords',
            value: 'something'
          })
        )

      await tap.equal(res3.statusCode, 207)
      const result3 = res3.body.status
      await tap.equal(result3.length, 1)
      await tap.equal(result3[0].status, 403)
      await tap.equal(
        result3[0].message,
        `Access to source ${sourceId} disallowed`
      )

      // add attribution
      const res4 = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            operation: 'add',
            sources: [sourceId],
            property: 'author',
            value: 'something'
          })
        )

      await tap.equal(res4.statusCode, 207)
      const result4 = res4.body.status
      await tap.equal(result4.length, 1)
      await tap.equal(result4[0].status, 403)
      await tap.equal(
        result4[0].message,
        `Access to source ${sourceId} disallowed`
      )

      // remove attribution
      const res5 = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            operation: 'remove',
            sources: [sourceId],
            property: 'author',
            value: 'something'
          })
        )

      await tap.equal(res5.statusCode, 207)
      const result5 = res5.body.status
      await tap.equal(result5.length, 1)
      await tap.equal(result5[0].status, 403)
      await tap.equal(
        result5[0].message,
        `Access to source ${sourceId} disallowed`
      )

      // add tags
      const res6 = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            operation: 'add',
            sources: [sourceId],
            property: 'tags',
            value: ['something']
          })
        )

      await tap.equal(res6.statusCode, 207)
      const result6 = res6.body.status
      await tap.equal(result6.length, 1)
      await tap.equal(result6[0].status, 403)
      await tap.equal(
        result6[0].message,
        `Access to source ${sourceId} disallowed`
      )

      // remove tags
      const res7 = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            operation: 'remove',
            sources: [sourceId],
            property: 'tags',
            value: 'something'
          })
        )

      await tap.equal(res7.statusCode, 207)
      const result7 = res7.body.status
      await tap.equal(result7.length, 1)
      await tap.equal(result7[0].status, 403)
      await tap.equal(
        result7[0].message,
        `Access to source ${sourceId} disallowed`
      )
    }
  )

  await tap.test(
    'Try to batch update a source by adding a tag that belongs to another user',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            operation: 'add',
            sources: [sourceId2],
            property: 'tags',
            value: [tagId]
          })
        )

      await tap.equal(res.statusCode, 207)
      const result = res.body.status
      await tap.equal(result.length, 1)
      await tap.equal(result[0].status, 403)
      await tap.equal(result[0].message, `Access to tag ${tagId} disallowed`)
    }
  )

  await tap.test(
    'Try to batch update a source by removing a tag that belongs to another user',
    async () => {
      const res = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            operation: 'remove',
            sources: [sourceId2],
            property: 'tags',
            value: [tagId]
          })
        )

      await tap.equal(res.statusCode, 207)
      const result = res.body.status
      await tap.equal(result.length, 1)
      await tap.equal(result[0].status, 403)
      await tap.equal(result[0].message, `Access to tag ${tagId} disallowed`)
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
        .put(`/noteContexts/${noteContext1.shortId}`)
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
        `Access to NoteContext ${noteContext1.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteContexts/${noteContext1.shortId}`
      )
    }
  )

  await tap.test(
    'Try to delete a noteContext belonging to another user',
    async () => {
      const res = await request(app)
        .delete(`/noteContexts/${noteContext1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to NoteContext ${noteContext1.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteContexts/${noteContext1.shortId}`
      )
    }
  )

  await tap.test(
    'Try to add a note to a noteContext belonging to another user',
    async () => {
      const res = await request(app)
        .post(`/noteContexts/${noteContext1.shortId}/notes`)
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
        `Access to NoteContext ${noteContext1.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteContexts/${noteContext1.shortId}/notes`
      )
    }
  )

  await tap.test(
    'Try to copy a note belonging to another user to a noteContext',
    async () => {
      const res = await request(app)
        .post(`/noteContexts/${noteContext2.shortId}/notes?source=${noteId}`)
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
        `/noteContexts/${noteContext2.shortId}/notes?source=${noteId}`
      )
    }
  )

  await tap.test(
    'Try to get a NoteContext belonging to another user',
    async () => {
      const res = await request(app)
        .get(`/noteContexts/${noteContext1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to NoteContext ${noteContext1.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteContexts/${noteContext1.shortId}`
      )
    }
  )

  // ------------------------------------- OUTLINE -----------------------

  await tap.test(
    'Try to update an outline belonging to another user',
    async () => {
      const res = await request(app)
        .put(`/outlines/${outline1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(JSON.stringify({ type: 'outline' }))

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Outline ${outline1.shortId} disallowed`
      )
      await tap.equal(error.details.requestUrl, `/outlines/${outline1.shortId}`)
    }
  )

  await tap.test(
    'Try to delete an outline belonging to another user',
    async () => {
      const res = await request(app)
        .delete(`/outlines/${outline1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Outline ${outline1.shortId} disallowed`
      )
      await tap.equal(error.details.requestUrl, `/outlines/${outline1.shortId}`)
    }
  )

  await tap.test(
    'Try to add a note to an outline belonging to another user',
    async () => {
      const res = await request(app)
        .post(`/outlines/${outline1.shortId}/notes`)
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
        `Access to Outline ${outline1.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/outlines/${outline1.shortId}/notes`
      )
    }
  )

  await tap.test(
    'Try to copy a note belonging to another user to an outline',
    async () => {
      const res = await request(app)
        .post(`/outlines/${outline2.shortId}/notes?source=${noteId}`)
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
        `/outlines/${outline2.shortId}/notes?source=${noteId}`
      )
    }
  )

  await tap.test(
    'Try to delete a note from an outline belonging to another user',
    async () => {
      const res = await request(app)
        .delete(`/outlines/${outline1.shortId}/notes/${note2.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Outline ${outline1.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/outlines/${outline1.shortId}/notes/${note2.shortId}`
      )
    }
  )

  await tap.test(
    'Try to delete a note belonging to another user from an outline',
    async () => {
      const res = await request(app)
        .delete(`/outlines/${outline2.shortId}/notes/${noteId}`)
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
        `/outlines/${outline2.shortId}/notes/${noteId}`
      )
    }
  )

  await tap.test(
    'Try to update a note from an outline belonging to another user',
    async () => {
      const res = await request(app)
        .patch(`/outlines/${outline1.shortId}/notes/${note2.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(JSON.stringify({ json: { proprety: 'value' } }))

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Outline ${outline1.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/outlines/${outline1.shortId}/notes/${note2.shortId}`
      )
    }
  )

  await tap.test(
    'Try to update a note belonging to another user from an outline',
    async () => {
      const res = await request(app)
        .patch(`/outlines/${outline2.shortId}/notes/${noteId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(JSON.stringify({ json: { proprety: 'value' } }))

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.message, `Access to Note ${noteId} disallowed`)
      await tap.equal(
        error.details.requestUrl,
        `/outlines/${outline2.shortId}/notes/${noteId}`
      )
    }
  )

  await tap.test(
    'Try to get an Outline belonging to another user',
    async () => {
      const res = await request(app)
        .get(`/outlines/${outline1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Outline ${outline1.shortId} disallowed`
      )
      await tap.equal(error.details.requestUrl, `/outlines/${outline1.shortId}`)
    }
  )

  // --------------------------------------- NOTEBOOK -------------------------

  await tap.test(
    'Try to get a Notebook belonging to another user',
    async () => {
      const res = await request(app)
        .get(`/notebooks/${notebook1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Notebook ${notebook1.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook1.shortId}`
      )
    }
  )

  await tap.test(
    'Try to update a notebook belonging to another user',
    async () => {
      const res = await request(app)
        .put(`/notebooks/${notebook1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(JSON.stringify({ name: 'test2' }))

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Notebook ${notebook1.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook1.shortId}`
      )
    }
  )

  await tap.test(
    'Try to delete a notebook belonging to another user',
    async () => {
      const res = await request(app)
        .delete(`/notebooks/${notebook1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Notebook ${notebook1.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook1.shortId}`
      )
    }
  )

  await tap.test(
    'Try to assign a source belonging to another user to a notebook',
    async () => {
      const res = await request(app)
        .put(`/notebooks/${notebook2.shortId}/sources/${sourceId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.message, `Access to Source ${sourceId} disallowed`)
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook2.shortId}/sources/${sourceId}`
      )
    }
  )

  await tap.test(
    'Try to assign a source to a notebook belongint to another user',
    async () => {
      const res = await request(app)
        .put(`/notebooks/${notebook1.shortId}/sources/${sourceId2}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Notebook ${notebook1.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook1.shortId}/sources/${sourceId2}`
      )
    }
  )

  await tap.test(
    'Try to remove a source belonging to another user from a notebook',
    async () => {
      const res = await request(app)
        .delete(`/notebooks/${notebook2.shortId}/sources/${sourceId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.message, `Access to Source ${sourceId} disallowed`)
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook2.shortId}/sources/${sourceId}`
      )
    }
  )

  await tap.test(
    'Try to remove a source to a notebook belongint from another user',
    async () => {
      const res = await request(app)
        .delete(`/notebooks/${notebook1.shortId}/sources/${sourceId2}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Notebook ${notebook1.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook1.shortId}/sources/${sourceId2}`
      )
    }
  )

  await tap.test(
    'Try to remove a source belonging to another user from a notebook',
    async () => {
      const res = await request(app)
        .delete(`/notebooks/${notebook2.shortId}/sources/${sourceId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.message, `Access to Source ${sourceId} disallowed`)
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook2.shortId}/sources/${sourceId}`
      )
    }
  )

  await tap.test(
    'Try to remove a source to a notebook belongint from another user',
    async () => {
      const res = await request(app)
        .delete(`/notebooks/${notebook1.shortId}/sources/${sourceId2}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Notebook ${notebook1.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook1.shortId}/sources/${sourceId2}`
      )
    }
  )

  await tap.test(
    'Try to assign a note belonging to another user to a notebook',
    async () => {
      const res = await request(app)
        .put(`/notebooks/${notebook2.shortId}/notes/${noteId}`)
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
        `/notebooks/${notebook2.shortId}/notes/${noteId}`
      )
    }
  )

  await tap.test(
    'Try to assign a note to a notebook belonging to another user',
    async () => {
      const res = await request(app)
        .put(`/notebooks/${notebook1.shortId}/notes/${noteId2}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Notebook ${notebook1.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook1.shortId}/notes/${noteId2}`
      )
    }
  )

  await tap.test(
    'Try to remove a note belonging to another user from a notebook',
    async () => {
      const res = await request(app)
        .delete(`/notebooks/${notebook2.shortId}/notes/${noteId}`)
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
        `/notebooks/${notebook2.shortId}/notes/${noteId}`
      )
    }
  )

  await tap.test(
    'Try to remove a note from a notebook belongint from another user',
    async () => {
      const res = await request(app)
        .delete(`/notebooks/${notebook1.shortId}/notes/${noteId2}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Notebook ${notebook1.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook1.shortId}/notes/${noteId2}`
      )
    }
  )

  await tap.test(
    'Try to create a note in a notebook belonging to another user',
    async () => {
      const res = await request(app)
        .post(`/notebooks/${notebook1.shortId}/notes`)
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
        `Access to Notebook ${notebook1.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook1.shortId}/notes`
      )
    }
  )

  await tap.test(
    'Try to assign a tag belonging to another user to a notebook',
    async () => {
      const res = await request(app)
        .put(`/notebooks/${notebook2.shortId}/tags/${tagId}`)
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
        `/notebooks/${notebook2.shortId}/tags/${tagId}`
      )
    }
  )

  await tap.test(
    'Try to assign a tag to a notebook belonging to another user',
    async () => {
      const res = await request(app)
        .put(`/notebooks/${notebook1.shortId}/tags/${tagId2}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Notebook ${notebook1.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook1.shortId}/tags/${tagId2}`
      )
    }
  )

  await tap.test(
    'Try to remove a tag belonging to another user from a notebook',
    async () => {
      const res = await request(app)
        .delete(`/notebooks/${notebook2.shortId}/tags/${tagId}`)
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
        `/notebooks/${notebook2.shortId}/tags/${tagId}`
      )
    }
  )

  await tap.test(
    'Try to remove a tag from a notebook belonging from another user',
    async () => {
      const res = await request(app)
        .delete(`/notebooks/${notebook1.shortId}/tags/${tagId2}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(
        error.message,
        `Access to Notebook ${notebook1.shortId} disallowed`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebook1.shortId}/tags/${tagId2}`
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

  await tap.test(
    'Try to update reader object belonging to another reader',
    async () => {
      const res = await request(app)
        .put(`/readers/${readerId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(JSON.stringify({ name: 'new name' }))

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

  // ------------------------------------- TAG - SOURCE ---------------------------

  await tap.test(
    'Try to assign a tag to a source belonging to another user',
    async () => {
      const res = await request(app)
        .put(`/sources/${sourceId}/tags/${tagId2}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.message, `Access to Source ${sourceId} disallowed`)
      await tap.equal(
        error.details.requestUrl,
        `/sources/${sourceId}/tags/${tagId2}`
      )
    }
  )

  await tap.test(
    'Try to assign a tag belonging to another user to a source',
    async () => {
      const res = await request(app)
        .put(`/sources/${sourceId2}/tags/${tagId}`)
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
        `/sources/${sourceId2}/tags/${tagId}`
      )
    }
  )

  await tap.test(
    'Try to remove a tag from a source belonging to another user',
    async () => {
      const res = await request(app)
        .delete(`/sources/${sourceId}/tags/${tagId2}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.message, `Access to Source ${sourceId} disallowed`)
      await tap.equal(
        error.details.requestUrl,
        `/sources/${sourceId}/tags/${tagId2}`
      )
    }
  )

  await tap.test(
    'Try to remove a tag belonging to another user from a source',
    async () => {
      const res = await request(app)
        .delete(`/sources/${sourceId2}/tags/${tagId}`)
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
        `/sources/${sourceId2}/tags/${tagId}`
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

  // ----------------------------------- READACTIVITY ---------------------------

  await tap.test(
    'Try to create a readActivity for a source belonging to another user',
    async () => {
      const res = await request(app)
        .post(`/sources/${sourceId}/readActivity`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token2}`)
        .type('application/ld+json')
        .send(JSON.stringify({ selector: { property: 'something' } }))

      await tap.equal(res.statusCode, 403)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 403)
      await tap.equal(error.error, 'Forbidden')
      await tap.equal(error.message, `Access to source ${sourceId} disallowed`)
      await tap.equal(
        error.details.requestUrl,
        `/sources/${sourceId}/readActivity`
      )
    }
  )

  await destroyDB(app)
}

module.exports = test
