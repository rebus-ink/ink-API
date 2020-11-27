const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createNote
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')
const { Note } = require('../../../models/Note')

const test = async app => {
  const token = getToken()
  const readerUrl = await createUser(app, token)
  const readerId = urlToId(readerUrl)

  const source = await createSource(app, token)
  const sourceUrl = source.id
  const sourceId = urlToId(source.id)

  const note = await createNote(app, token, {
    target: { property: 'value' },
    sourceId,
    body: { content: 'text goes here', motivation: 'test' }
  })

  noteId = urlToId(note.id)

  const note2 = await createNote(app, token, {
    body: { motivation: 'test' }
  })

  await tap.test('Delete a Note', async () => {
    const res = await request(app)
      .delete(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 204)
  })

  await tap.test(
    'Trying to get a deleted note should return a 404 error',
    async () => {
      const getres = await request(app)
        .get(`/notes/${noteId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(getres.statusCode, 404)
      const error = JSON.parse(getres.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.error, 'Not Found')
      await tap.equal(
        error.message,
        `Get Note Error: No Note found with id ${noteId}`
      )
      await tap.equal(error.details.requestUrl, `/notes/${noteId}`)
    }
  )

  await tap.test(
    'Deleted Note should no longer be attached to source',
    async () => {
      // note should no longer be attached to source
      const sourceres = await request(app)
        .get(`/sources/${urlToId(sourceUrl)}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(sourceres.statusCode, 200)

      const body = sourceres.body
      await tap.ok(Array.isArray(body.replies))
      await tap.equal(body.replies.length, 0)
    }
  )

  await tap.test(
    'Deleted Note should no longer show up in a list of the reader notes',
    async () => {
      const res = await request(app)
        .get(`/notes`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.statusCode, 200)
      await tap.equal(res.body.items.length, 1)
    }
  )

  await tap.test('Try to delete a Note that does not exist', async () => {
    const res1 = await request(app)
      .delete(`/notes/${noteId}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res1.statusCode, 404)
    const error1 = JSON.parse(res1.text)
    await tap.equal(error1.statusCode, 404)
    await tap.equal(error1.error, 'Not Found')
    await tap.equal(
      error1.message,
      `Note Delete Error: No Note found with id ${noteId}abc`
    )
    await tap.equal(error1.details.requestUrl, `/notes/${noteId}abc`)
  })

  await tap.test('Try to delete a Note that was already deleted', async () => {
    const res = await request(app)
      .delete(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(
      error.message,
      `Note Delete Error: No Note found with id ${noteId}`
    )
    await tap.equal(error.details.requestUrl, `/notes/${noteId}`)
  })

  await tap.test('Try to update a Note that was already deleted', async () => {
    const res = await request(app)
      .put(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          readerId,
          body: { content: 'something', motivation: 'test' }
        })
      )

    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(
      error.message,
      `Put Note Error: No Note found with id ${noteId}`
    )
    await tap.equal(error.details.requestUrl, `/notes/${noteId}`)
    await tap.equal(error.details.requestBody.body.content, 'something')
  })

  await tap.test('Empty a note', async () => {
    const before = await request(app)
      .get(`/notes`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(before.body.items.length, 1)

    const res = await request(app)
      .delete(`/notes/${note2.shortId}?empty=true`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 204)

    // should not be able to get the source
    const after = await request(app)
      .get(`/notes`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(after.body.items.length, 0)

    const getres = await request(app)
      .get(`/notes/${note2.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(getres.statusCode, 404)

    // but the note is not actually deleted, only marked as 'emptied'
    const noteAfter = await Note.query().findById(note2.shortId)
    await tap.ok(noteAfter)
    await tap.ok(noteAfter.emptied)
    await tap.notOk(noteAfter.deleted)
  })

  // // DELETE NOTES FOR SOURCE
  // await tap.test('Delete all Notes for a Source', async () => {
  //   // create two notes for our source:
  //   const createNoteRes = await createNote(app, token, {
  //     content: 'This is the content of note B.',
  //     'oa:hasSelector': { propety: 'value' },
  //     context: sourceUrl,
  //     noteType: 'test'
  //   })
  //   const createNoteActivityUrl1 = createNoteRes.get('Location')
  //   const noteActivityObject1 = await getActivityFromUrl(
  //     app,
  //     createNoteActivityUrl1,
  //     token
  //   )
  //   newNoteUrl = noteActivityObject1.object.id
  //   newNoteId = urlToId(noteActivityObject1.object.id)
  //   await createNote(app, token, {
  //     content: 'This is the content of note C.',
  //     'oa:hasSelector': { propety: 'value' },
  //     context: sourceUrl,
  //     noteType: 'test'
  //   })

  //   // before: source has two replies
  //   const sourceresbefore = await request(app)
  //     .get(`/sources/${urlToId(sourceUrl)}`)
  //     .set('Host', 'reader-api.test')
  //     .set('Authorization', `Bearer ${token}`)
  //     .type(
  //       'application/ld+json'
  //     )

  //   await tap.equal(sourceresbefore.body.replies.length, 2)

  //   // now delete all notes for source:
  //   const res = await request(app)
  //     .post(`/reader-${readerId}/activity`)
  //     .set('Host', 'reader-api.test')
  //     .set('Authorization', `Bearer ${token}`)
  //     .type(
  //       'application/ld+json'
  //     )
  //     .send(
  //       JSON.stringify({
  //         '@context': [
  //           { reader: 'https://rebus.foundation/ns/reader' }
  //         ],
  //         type: 'Delete',
  //         object: {
  //           type: 'Collection',
  //           name: 'Source Notes',
  //           id: sourceUrl
  //         }
  //       })
  //     )

  //   await tap.equal(res.statusCode, 204)

  //   // notes should no longer exist
  //   const getres = await request(app)
  //     .get(`/notes/${newNoteId}`)
  //     .set('Host', 'reader-api.test')
  //     .set('Authorization', `Bearer ${token}`)
  //     .type(
  //       'application/ld+json'
  //     )

  //   await tap.equal(getres.statusCode, 404)
  //   const error = JSON.parse(getres.text)
  //   await tap.equal(error.statusCode, 404)
  //   await tap.equal(error.error, 'Not Found')
  //   await tap.equal(error.details.type, 'Note')
  //   await tap.type(error.details.id, 'string')
  //   await tap.equal(error.details.activity, 'Get Note')

  //   // source should now have no notes
  //   const sourceresafter = await request(app)
  //     .get(`/sources/${urlToId(sourceUrl)}`)
  //     .set('Host', 'reader-api.test')
  //     .set('Authorization', `Bearer ${token}`)
  //     .type(
  //       'application/ld+json'
  //     )

  //   await tap.equal(sourceresafter.body.replies.length, 0)
  // })

  // await tap.test(
  //   'Try to delete all Notes for a Source with undefined source id',
  //   async () => {
  //     const res = await request(app)
  //       .post(`/reader-${readerId}/activity`)
  //       .set('Host', 'reader-api.test')
  //       .set('Authorization', `Bearer ${token}`)
  //       .type(
  //         'application/ld+json'
  //       )
  //       .send(
  //         JSON.stringify({
  //           '@context': [
  //             { reader: 'https://rebus.foundation/ns/reader' }
  //           ],
  //           type: 'Delete',
  //           object: {
  //             type: 'Collection',
  //             name: 'Source Notes'
  //           }
  //         })
  //       )

  //     await tap.equal(res.statusCode, 400)
  //     const error = JSON.parse(res.text)
  //     await tap.equal(error.statusCode, 400)
  //     await tap.equal(error.error, 'Bad Request')
  //     await tap.equal(error.details.type, 'Collection')
  //     await tap.equal(error.details.activity, 'Delete Collection')
  //     await tap.equal(error.details.missingParams[0], 'object.id')
  //   }
  // )

  // await tap.test('Delete all notes for an invalid source id', async () => {
  //   const res = await request(app)
  //     .post(`/reader-${readerId}/activity`)
  //     .set('Host', 'reader-api.test')
  //     .set('Authorization', `Bearer ${token}`)
  //     .type(
  //       'application/ld+json'
  //     )
  //     .send(
  //       JSON.stringify({
  //         '@context': [
  //           { reader: 'https://rebus.foundation/ns/reader' }
  //         ],
  //         type: 'Delete',
  //         object: {
  //           type: 'Collection',
  //           name: 'Source Notes',
  //           id: '123'
  //         }
  //       })
  //     )

  //   // NOTE: does not return an error. It just deletes nothing.
  //   await tap.equal(res.statusCode, 204)
  // })

  await destroyDB(app)
}

module.exports = test
