const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createNoteContext,
  createNote
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerUrl = await createUser(app, token)
  const readerId = urlToId(readerUrl)

  const source = await createSource(app, token)
  const sourceId = urlToId(source.id)

  // source2
  await createSource(app, token)

  const context = await createNoteContext(app, token, {
    type: 'test',
    name: 'my context'
  })
  const contextId = context.shortId
  const note = await createNote(app, token, {
    body: { content: 'to be copied', motivation: 'test' }
  })
  const noteId = urlToId(note.id)
  let noteCopy

  await tap.test('Add to context a Note with a single body', async () => {
    const res = await request(app)
      .post(`/noteContexts/${contextId}/notes`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          body: {
            content: 'this is the content of the note',
            motivation: 'test'
          },
          json: { property1: 'value1' }
        })
      )
    await tap.equal(res.status, 201)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.contextId, contextId)
    await tap.equal(body.json.property1, 'value1')
    await tap.ok(body.published)
    await tap.ok(body.body)
    await tap.ok(body.body[0].content)
    await tap.equal(body.body[0].motivation, 'test')

    await tap.type(res.get('Location'), 'string')
    await tap.equal(res.get('Location'), body.id)
  })

  await tap.test('Create Note with two bodies', async () => {
    const res = await request(app)
      .post(`/noteContexts/${contextId}/notes`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          body: [
            {
              content: 'this is the content of the note',
              motivation: 'test'
            },
            {
              motivation: 'test'
            }
          ],
          json: { property1: 'value1' }
        })
      )
    await tap.equal(res.status, 201)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.contextId, contextId)
    await tap.equal(body.json.property1, 'value1')
    await tap.ok(body.published)
    await tap.ok(body.body)
    await tap.equal(body.body.length, 2)
    await tap.ok(body.body[0].content)
    await tap.equal(body.body[0].motivation, 'test')
    await tap.notOk(body.body[1].content)
    await tap.equal(body.body[1].motivation, 'test')
  })

  await tap.test('Create Note with sourceId', async () => {
    const res = await request(app)
      .post(`/noteContexts/${contextId}/notes`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          body: {
            content: 'this is the content of the note',
            motivation: 'test'
          },
          sourceId
        })
      )
    await tap.equal(res.status, 201)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.contextId, contextId)
    await tap.ok(body.published)
    await tap.ok(body.body)
    await tap.ok(body.body[0].content)
    await tap.equal(body.body[0].motivation, 'test')
    await tap.equal(urlToId(body.sourceId), sourceId)
  })

  // ADD TESTS: notes should show up when fetching the context

  // ------------------------------------- VALIDATION ERRORS ------------------------------------

  await tap.test('Try to create a Note without a body', async () => {
    const res = await request(app)
      .post(`/noteContexts/${contextId}/notes`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          canonical: 'one'
        })
      )

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      'Create Note Validation Error: body is a required property'
    )
    await tap.equal(
      error.details.requestUrl,
      `/noteContexts/${contextId}/notes`
    )
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.canonical, 'one')
  })

  await tap.test(
    'Try to create a Note with a body but no motivation',
    async () => {
      const res = await request(app)
        .post(`/noteContexts/${contextId}/notes`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            canonical: 'one',
            body: {
              content: 'this should not show up!!!!!!!!',
              language: 'en'
            },
            json: { property: 'this should not be saved!!' }
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        'Note Validation Error: body.motivation is a required property'
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteContexts/${contextId}/notes`
      )
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.canonical, 'one')
    }
  )

  await tap.test(
    'Try to create a Note for a Context that does not exist',
    async () => {
      const res = await request(app)
        .post(`/noteContexts/${contextId}abc/notes`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            canonical: 'one',
            body: {
              content: 'test',
              language: 'en'
            },
            json: { property: 'value' }
          })
        )

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.error, 'Not Found')
      await tap.equal(
        error.message,
        `Add Note to Context Error: No Context found with id: ${contextId}abc`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteContexts/${contextId}abc/notes`
      )
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.canonical, 'one')
    }
  )

  // copy existing note
  await tap.test('Copy an existing note to the context', async () => {
    const res = await request(app)
      .post(`/noteContexts/${contextId}/notes?source=${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 201)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.notEqual(body.shortId, noteId)
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.contextId, contextId)
    await tap.ok(body.published)
    await tap.ok(body.body)
    await tap.ok(body.body[0].content)
    await tap.equal(body.body[0].content, 'to be copied')
    await tap.equal(body.body[0].motivation, 'test')

    await tap.type(res.get('Location'), 'string')
    await tap.equal(res.get('Location'), body.id)
    noteCopy = res.body
  })

  await tap.test(
    'Updating the copied Note should not affect the original',
    async () => {
      const res = await request(app)
        .put(`/notes/${noteCopy.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            body: { content: 'new content', motivation: 'test' },
            json: { property: 'new' }
          })
        )

      await tap.equal(res.body.body[0].content, 'new content')
      await tap.equal(res.body.json.property, 'new')

      // get old note
      const resNote = await request(app)
        .get(`/notes/${noteId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(resNote.body.body[0].content, 'to be copied')
      await tap.notOk(resNote.body.json)
    }
  )

  await tap.test('Try to copy a note that does not exist', async () => {
    const res = await request(app)
      .post(`/noteContexts/${contextId}/notes?source=${noteId}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(
      error.message,
      `Add Note to Context Error: No Note found with id: ${noteId}abc`
    )
    await tap.equal(
      error.details.requestUrl,
      `/noteContexts/${contextId}/notes?source=${noteId}abc`
    )
  })

  await tap.test(
    'Try to copy a note to a Context that does not exist',
    async () => {
      const res = await request(app)
        .post(`/noteContexts/${contextId}abc/notes?source=${noteId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.error, 'Not Found')
      await tap.equal(
        error.message,
        `Add Note to Context Error: No Context found with id: ${contextId}abc`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteContexts/${contextId}abc/notes?source=${noteId}`
      )
    }
  )

  await destroyDB(app)
}

module.exports = test
