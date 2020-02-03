const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createNote,
  createDocument
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerUrl = await createUser(app, token)
  const readerId = urlToId(readerUrl)

  const publication = await createPublication(readerId)
  const publicationUrl = publication.id
  const publicationId = urlToId(publication.id)

  const createdDocument = await createDocument(readerUrl, publicationUrl)

  const documentUrl = `${publicationUrl}/${createdDocument.documentPath}`

  const note = await createNote(app, token, readerId, {
    target: { property: 'value' },
    publicationId,
    documentUrl,
    body: { content: 'text goes here', motivation: 'test' }
  })

  noteId = urlToId(note.id)

  await tap.test('Delete a Note', async () => {
    const res = await request(app)
      .delete(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 204)

    // note should no longer exist
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
  })

  await tap.test(
    'Deleted Note should no longer be attached to publication',
    async () => {
      // note should no longer be attached to publication
      const pubres = await request(app)
        .get(`/publications/${urlToId(publicationUrl)}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(pubres.statusCode, 200)

      const body = pubres.body
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
      await tap.equal(res.body.items.length, 0)
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

  // // DELETE NOTES FOR PUB
  // await tap.test('Delete all Notes for a Publication', async () => {
  //   // create two notes for our publication:
  //   const createNoteRes = await createNote(app, token, readerId, {
  //     content: 'This is the content of note B.',
  //     'oa:hasSelector': { propety: 'value' },
  //     context: publicationUrl,
  //     inReplyTo: documentUrl,
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
  //   await createNote(app, token, readerId, {
  //     content: 'This is the content of note C.',
  //     'oa:hasSelector': { propety: 'value' },
  //     context: publicationUrl,
  //     inReplyTo: documentUrl,
  //     noteType: 'test'
  //   })

  //   // before: publication has two replies
  //   const pubresbefore = await request(app)
  //     .get(`/publications/${urlToId(publicationUrl)}`)
  //     .set('Host', 'reader-api.test')
  //     .set('Authorization', `Bearer ${token}`)
  //     .type(
  //       'application/ld+json'
  //     )

  //   await tap.equal(pubresbefore.body.replies.length, 2)

  //   // now delete all notes for pub:
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
  //           name: 'Publication Notes',
  //           id: publicationUrl
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

  //   // publication should now have no notes
  //   const pubresafter = await request(app)
  //     .get(`/publications/${urlToId(publicationUrl)}`)
  //     .set('Host', 'reader-api.test')
  //     .set('Authorization', `Bearer ${token}`)
  //     .type(
  //       'application/ld+json'
  //     )

  //   await tap.equal(pubresafter.body.replies.length, 0)
  // })

  // await tap.test(
  //   'Try to delete all Notes for a Publication with undefined publication id',
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
  //             name: 'Publication Notes'
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

  // await tap.test('Delete all notes for an invalid publication id', async () => {
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
  //           name: 'Publication Notes',
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
