const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  destroyDB,
  createReader,
  createSource,
  createNote,
  createNoteContext,
  createTag,
  createNoteRelation,
  createOutline
} = require('../../utils/testUtils')

const test = async app => {
  const token = getToken()

  const reader = await createReader(app, token, {
    name: 'Joe Smith',
    profile: {
      favoriteColor: 'blue'
    },
    preferences: {
      property: 'value1'
    },
    json: {
      property2: 'value2'
    }
  })

  // add stuff for reader
  const source = await createSource(app, token)
  const note1 = await createNote(app, token)
  const note2 = await createNote(app, token)
  const context = await createNoteContext(app, token, {
    type: 'test',
    name: 'my context'
  })
  const noteRelation = await createNoteRelation(app, token, {
    from: note1.shortId,
    to: note2.shortId,
    type: 'test',
    json: { property: 'value' }
  })
  const tag = await createTag(app, token)
  const outline = await createOutline(app, token)

  await tap.test('Delete reader', async () => {
    const res = await request(app)
      .delete(`/readers/${reader.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)
  })

  await tap.test('Cannot get deleted reader', async () => {
    const res = await request(app)
      .get(`/readers/${reader.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(
      error.message,
      `Get Reader Error: No Reader found with id ${reader.shortId}`
    )
    await tap.equal(error.details.requestUrl, `/readers/${reader.shortId}`)

    const res1 = await request(app)
      .get(`/whoami`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res1.status, 404)
    const error1 = JSON.parse(res1.text)
    await tap.equal(error1.statusCode, 404)
    await tap.equal(error1.error, 'Not Found')
    await tap.equal(error1.message, `No reader found with this token`)
    await tap.equal(error1.details.requestUrl, `/whoami`)
  })

  await tap.test(
    'Cannot get deleted source, note, noteContext, tag... belonging to deleted reader',
    async () => {
      const resPub = await request(app)
        .get(`/sources/${source.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(resPub.status, 404)
      const errorPub = JSON.parse(resPub.text)
      await tap.equal(errorPub.statusCode, 404)
      await tap.equal(errorPub.error, 'Not Found')
      await tap.equal(
        errorPub.message,
        `No Source found with id ${source.shortId}`
      )
      await tap.equal(errorPub.details.requestUrl, `/sources/${source.shortId}`)

      const resNote = await request(app)
        .get(`/notes/${note1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(resNote.status, 404)
      const errorNote = JSON.parse(resNote.text)
      await tap.equal(errorNote.statusCode, 404)
      await tap.equal(errorNote.error, 'Not Found')
      await tap.equal(
        errorNote.message,
        `Get Note Error: No Note found with id ${note1.shortId}`
      )
      await tap.equal(errorNote.details.requestUrl, `/notes/${note1.shortId}`)

      const resNoteContext = await request(app)
        .get(`/noteContexts/${context.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(resNoteContext.status, 404)
      const errorContext = JSON.parse(resNoteContext.text)
      await tap.equal(errorContext.statusCode, 404)
      await tap.equal(errorContext.error, 'Not Found')
      await tap.equal(
        errorContext.message,
        `Get NoteContext Error: No NoteContext found with id ${context.shortId}`
      )
      await tap.equal(
        errorContext.details.requestUrl,
        `/noteContexts/${context.shortId}`
      )

      const resTags = await request(app)
        .get(`/tags`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(resTags.status, 404)
      const errorTags = JSON.parse(resTags.text)
      await tap.equal(errorTags.statusCode, 404)
      await tap.equal(errorTags.error, 'Not Found')
      await tap.equal(errorTags.message, `No reader found with this token`)
      await tap.equal(errorTags.details.requestUrl, `/tags`)

      const resLibrary = await request(app)
        .get(`/library`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(resLibrary.status, 404)
      const errorLibrary = JSON.parse(resLibrary.text)
      await tap.equal(errorLibrary.statusCode, 404)
      await tap.equal(errorLibrary.error, 'Not Found')
      await tap.equal(errorLibrary.message, `No reader found with this token`)
      await tap.equal(errorLibrary.details.requestUrl, `/library`)

      const resNotes = await request(app)
        .get(`/notes`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(resNotes.status, 404)
      const errorNotes = JSON.parse(resNotes.text)
      await tap.equal(errorNotes.statusCode, 404)
      await tap.equal(errorNotes.error, 'Not Found')
      await tap.equal(errorNotes.message, `No reader found with this token`)
      await tap.equal(errorNotes.details.requestUrl, `/notes`)
    }
  )

  await tap.test(
    'Try to create a user with the same token after reader deleted',
    async () => {
      const res = await request(app)
        .post('/readers')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'Jane Doe',
            profile: { property: 'value' },
            preferences: { favoriteColor: 'blueish brown' },
            json: { something: '!!!!' }
          })
        )
      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.ok(error.message.startsWith('Reader already exists with id'))
      await tap.equal(error.details.requestUrl, '/readers')
      await tap.equal(error.details.requestBody.name, 'Jane Doe')
    }
  )

  await tap.test(
    'Routes should not work if accessed with the token for a deleted reader',
    async () => {
      // *************** Sources **************************

      // POST /sources
      const res1 = await request(app)
        .post('/sources')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(JSON.stringify({ name: 'something', type: 'Book' }))

      await tap.equal(res1.status, 404)
      const error1 = JSON.parse(res1.text)
      await tap.equal(error1.message, `No reader found with this token`)
      await tap.ok(error1.details.requestUrl)

      // PATCH /sources/:id
      const res2 = await request(app)
        .patch(`/sources/${source.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(JSON.stringify({ name: 'something', type: 'Book' }))

      await tap.equal(res2.status, 404)
      const error2 = JSON.parse(res2.text)
      await tap.equal(
        error2.message,
        `No Source found with id ${source.shortId}`
      )
      await tap.ok(error2.details.requestUrl)

      // DELETE /sources/:id
      const res3 = await request(app)
        .delete(`/sources/${source.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res3.status, 404)
      const error3 = JSON.parse(res3.text)
      await tap.equal(error3.message, `No reader found with this token`)
      await tap.ok(error3.details.requestUrl)

      // PUT /sources/:sourceId/tags/:tagId
      const res4 = await request(app)
        .put(`/sources/${source.shortId}/tags/${tag.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res4.status, 404)
      const error4 = JSON.parse(res4.text)
      await tap.equal(error4.message, `No reader found with this token`)
      await tap.ok(error4.details.requestUrl)

      // DELETE /sources/:sourceId/tags/:tagId
      const res5 = await request(app)
        .delete(`/sources/${source.shortId}/tags/${tag.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res5.status, 404)
      const error5 = JSON.parse(res5.text)
      await tap.equal(error5.message, `No reader found with this token`)
      await tap.ok(error5.details.requestUrl)

      // POST /sources/:id/readActivity
      const res6 = await request(app)
        .post(`/sources/${source.shortId}/readActivity`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            selector: {
              type: 'XPathSelector',
              value: '/html/body/p[2]/table/tr[2]/td[3]/span'
            }
          })
        )

      await tap.equal(res6.status, 404)
      const error6 = JSON.parse(res6.text)
      await tap.equal(error6.message, `No reader found with this token`)
      await tap.ok(error6.details.requestUrl)

      // PATCH /sources/batchUpdate
      const res7 = await request(app)
        .patch(`/sources/batchUpdate`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            operation: 'add',
            property: 'keywords',
            sources: [source.shortId],
            value: 'test'
          })
        )

      await tap.equal(res7.status, 404)
      const error7 = JSON.parse(res7.text)
      await tap.equal(error7.message, `No reader found with this token`)
      await tap.ok(error7.details.requestUrl)

      // ************************ tags **********************

      // POST /tags
      const res8 = await request(app)
        .post(`/tags`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'something',
            type: 'tag'
          })
        )

      await tap.equal(res8.status, 404)
      const error8 = JSON.parse(res8.text)
      await tap.equal(error8.message, `No reader found with this token`)
      await tap.ok(error8.details.requestUrl)

      // PUT /tags/:id
      const res9 = await request(app)
        .put(`/tags/${tag.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'something',
            type: 'tag'
          })
        )

      await tap.equal(res9.status, 404)
      const error9 = JSON.parse(res9.text)
      await tap.equal(error9.message, `No reader found with this token`)
      await tap.ok(error9.details.requestUrl)

      // DELETE /tags/:id
      const res10 = await request(app)
        .delete(`/tags/${tag.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res10.status, 404)
      const error10 = JSON.parse(res10.text)
      await tap.equal(error10.message, `No reader found with this token`)
      await tap.ok(error10.details.requestUrl)

      // ************************** notes ****************************

      // PUT /notes/:noteId/tags/:tagId
      const res11 = await request(app)
        .put(`/notes/${note1.shortId}/tags/${tag.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res11.status, 404)
      const error11 = JSON.parse(res11.text)
      await tap.equal(error11.message, `No reader found with this token`)
      await tap.ok(error11.details.requestUrl)

      // DELETE /notes/:noteId/tags/:tagId
      const res12 = await request(app)
        .delete(`/notes/${note1.shortId}/tags/${tag.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res12.status, 404)
      const error12 = JSON.parse(res12.text)
      await tap.equal(error12.message, `No reader found with this token`)
      await tap.ok(error12.details.requestUrl)

      // POST /notes
      const res13 = await request(app)
        .post(`/notes`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({ body: { motivation: 'test', content: 'something' } })
        )

      await tap.equal(res13.status, 404)
      const error13 = JSON.parse(res13.text)
      await tap.equal(error13.message, `No reader found with this token`)
      await tap.ok(error13.details.requestUrl)

      // PUT /notes/:id
      const res14 = await request(app)
        .put(`/notes/${note1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({ body: { motivation: 'test', content: 'something' } })
        )

      await tap.equal(res14.status, 404)
      const error14 = JSON.parse(res14.text)
      await tap.equal(error14.message, `No reader found with this token`)
      await tap.ok(error14.details.requestUrl)

      // DELETE /notes/:id
      const res15 = await request(app)
        .delete(`/notes/${note1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res15.status, 404)
      const error15 = JSON.parse(res15.text)
      await tap.equal(error15.message, `No reader found with this token`)
      await tap.ok(error15.details.requestUrl)

      // ************************* noteRelations *******************

      // POST /noteRelations
      const res16 = await request(app)
        .post(`/noteRelations`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            from: note1.shortId,
            to: note2.shortId,
            type: 'test',
            json: { property: 'value' }
          })
        )
      await tap.equal(res16.status, 404)
      const error16 = JSON.parse(res16.text)
      await tap.equal(error16.message, `No reader found with this token`)
      await tap.ok(error16.details.requestUrl)

      // PUT /noteRelations/:id
      const res17 = await request(app)
        .put(`/noteRelations/${noteRelation.id}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            from: note1.shortId,
            to: note2.shortId,
            type: 'test',
            json: { property: 'value' }
          })
        )
      await tap.equal(res17.status, 404)
      const error17 = JSON.parse(res17.text)
      await tap.equal(error17.message, `No reader found with this token`)
      await tap.ok(error17.details.requestUrl)

      // DELETE /noteRelations/:id
      const res18 = await request(app)
        .delete(`/noteRelations/${noteRelation.id}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res18.status, 404)
      const error18 = JSON.parse(res18.text)
      await tap.equal(error18.message, `No reader found with this token`)
      await tap.ok(error18.details.requestUrl)

      // ****************************** NoteContext *******************

      // POST /noteContexts
      const res19 = await request(app)
        .post(`/noteContexts`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'context1',
            description: 'this is the description of context1',
            type: 'outline',
            json: { property: 'value' }
          })
        )
      await tap.equal(res19.status, 404)
      const error19 = JSON.parse(res19.text)
      await tap.equal(error19.message, `No reader found with this token`)
      await tap.ok(error19.details.requestUrl)

      // PUT /noteContexts/:id
      const res20 = await request(app)
        .put(`/noteContexts/${context.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'context1',
            description: 'this is the description of context1',
            type: 'outline',
            json: { property: 'value' }
          })
        )
      await tap.equal(res20.status, 404)
      const error20 = JSON.parse(res20.text)
      await tap.equal(error20.message, `No reader found with this token`)
      await tap.ok(error20.details.requestUrl)

      // DELETE /noteContexts/:id
      const res21 = await request(app)
        .delete(`/noteContexts/${context.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res21.status, 404)
      const error21 = JSON.parse(res21.text)
      await tap.equal(error21.message, `No reader found with this token`)
      await tap.ok(error21.details.requestUrl)

      // POST /noteContexts/:id/notes
      const res22 = await request(app)
        .post(`/noteContexts/${context.shortId}/notes`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            body: { motivation: 'test', content: 'something' }
          })
        )
      await tap.equal(res22.status, 404)
      const error22 = JSON.parse(res22.text)
      await tap.equal(error22.message, `No reader found with this token`)
      await tap.ok(error22.details.requestUrl)

      // **************** outline ***************************

      // GET /outlines/:id
      const res23 = await request(app)
        .get(`/outlines/${outline.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res23.status, 404)
      const error23 = JSON.parse(res23.text)
      await tap.equal(
        error23.message,
        `Get outline Error: No Outline found with id ${outline.shortId}`
      )
      await tap.ok(error23.details.requestUrl)

      // POST /outlines
      const res24 = await request(app)
        .post(`/outlines`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res24.status, 404)
      const error24 = JSON.parse(res24.text)
      await tap.equal(error24.message, `No reader found with this token`)
      await tap.ok(error24.details.requestUrl)

      // DELETE /outlines/:id
      const res25 = await request(app)
        .delete(`/outlines/${outline.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res25.status, 404)
      const error25 = JSON.parse(res25.text)
      await tap.equal(error25.message, `No reader found with this token`)
      await tap.ok(error25.details.requestUrl)

      // PUT /outlines/:id
      const res26 = await request(app)
        .delete(`/outlines/${outline.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res26.status, 404)
      const error26 = JSON.parse(res26.text)
      await tap.equal(error26.message, `No reader found with this token`)
      await tap.ok(error26.details.requestUrl)

      // POST /outlines/:id/notes
      const res27 = await request(app)
        .post(`/outlines/${outline.shortId}/notes`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res27.status, 404)
      const error27 = JSON.parse(res27.text)
      await tap.equal(error27.message, `No reader found with this token`)
      await tap.ok(error27.details.requestUrl)

      // DELETE /outlines/:id/notes/:noteId
      const res28 = await request(app)
        .delete(`/outlines/${outline.shortId}/notes/${note1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res28.status, 404)
      const error28 = JSON.parse(res28.text)
      await tap.equal(error28.message, `No reader found with this token`)
      await tap.ok(error28.details.requestUrl)

      // PATCH /outlines/:id/notes/:noteId
      const res29 = await request(app)
        .patch(`/outlines/${outline.shortId}/notes/${note1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res29.status, 404)
      const error29 = JSON.parse(res29.text)
      await tap.equal(error29.message, `No reader found with this token`)
      await tap.ok(error29.details.requestUrl)
    }
  )

  await tap.test('Try to delete reader that does not exist', async () => {
    const res = await request(app)
      .delete(`/readers/${reader.shortId}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(
      error.message,
      `No Reader found with id ${reader.shortId}abc`
    )
    await tap.equal(error.details.requestUrl, `/readers/${reader.shortId}abc`)
  })

  await tap.test('Try to delete reader that was already deleted', async () => {
    const res = await request(app)
      .delete(`/readers/${reader.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(error.message, `No Reader found with id ${reader.shortId}`)
    await tap.equal(error.details.requestUrl, `/readers/${reader.shortId}`)
  })

  await destroyDB(app)
}

module.exports = test
