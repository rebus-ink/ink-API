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
const _ = require('lodash')

const test = async app => {
  const token = getToken()
  const readerUrl = await createUser(app, token)
  const readerId = urlToId(readerUrl)

  const source = await createSource(app, token)
  const sourceId = urlToId(source.id)

  // source2
  await createSource(app, token)

  const outline = await createNoteContext(app, token, {
    name: 'my outline',
    type: 'outline'
  })
  const outlineId = outline.shortId

  const note = await createNote(app, token, {
    body: { content: 'to be copied', motivation: 'test' }
  })
  const noteId = urlToId(note.id)
  let noteCopy
  let note1, note4, note5, note6

  await tap.test('Add to outline a Note with a single body', async () => {
    const res = await request(app)
      .post(`/outlines/${outlineId}/notes`)
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
    await tap.equal(body.contextId, outlineId)
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
      .post(`/outlines/${outlineId}/notes`)
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
    await tap.equal(body.contextId, outlineId)
    await tap.equal(body.json.property1, 'value1')
    await tap.ok(body.published)
    await tap.ok(body.body)
    await tap.equal(body.body.length, 2)
    await tap.ok(body.body[0].content)
    await tap.equal(body.body[0].motivation, 'test')
    await tap.notOk(body.body[1].content)
    await tap.equal(body.body[1].motivation, 'test')
  })

  await tap.test('Create Note with a sourceId', async () => {
    const res = await request(app)
      .post(`/outlines/${outlineId}/notes`)
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
    await tap.equal(body.contextId, outlineId)
    await tap.ok(body.published)
    await tap.ok(body.body)
    await tap.ok(body.body[0].content)
    await tap.equal(body.body[0].motivation, 'test')
    await tap.equal(urlToId(body.sourceId), sourceId)
  })

  await tap.test('Notes should show up when fetching the outline', async () => {
    const res = await request(app)
      .get(`/outlines/${outlineId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(body.type, 'outline')
    // notes & noteRelations
    await tap.equal(body.notes.length, 3)
    note1 = body.notes[0]
    note2 = body.notes[1]
    note3 = body.notes[2]
  })

  // 1 - 4
  await tap.test('Add a note with a previous property', async () => {
    const res = await request(app)
      .post(`/outlines/${outlineId}/notes`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          body: {
            content: 'this is the content of the note',
            motivation: 'test'
          },
          previous: note1.shortId
        })
      )
    await tap.equal(res.status, 201)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(body.previous, note1.shortId)
    note4 = body

    // previous note should be updated too
    const resPrevious = await request(app)
      .get(`/notes/${note1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(resPrevious.body.next, note4.shortId)
  })

  // 5 - 1 - 4
  await tap.test('Add a note with a next property', async () => {
    const res = await request(app)
      .post(`/outlines/${outlineId}/notes`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          body: {
            content: 'this is the content of the note',
            motivation: 'test'
          },
          next: note1.shortId
        })
      )
    await tap.equal(res.status, 201)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(body.next, note1.shortId)
    note5 = body

    // next note should be updated too
    const resNext = await request(app)
      .get(`/notes/${note1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(resNext.body.previous, note5.shortId)
  })

  // 5 - 6 - 1 - 4
  await tap.test(
    'Add a note with both a previous and a next property',
    async () => {
      const res = await request(app)
        .post(`/outlines/${outlineId}/notes`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            body: {
              content: 'this is the content of the note',
              motivation: 'test'
            },
            previous: note5.shortId,
            next: note1.shortId
          })
        )
      await tap.equal(res.status, 201)
      const body = res.body
      await tap.ok(body.id)
      await tap.equal(body.next, note1.shortId)
      await tap.equal(body.previous, note5.shortId)
      note6 = body

      // next and previous notes should be updated too
      const resNext = await request(app)
        .get(`/notes/${note1.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(resNext.body.previous, note6.shortId)

      const resPrevious = await request(app)
        .get(`/notes/${note5.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(resPrevious.body.next, note6.shortId)
    }
  )

  await tap.test(
    'outline should reflect the order created in previous tests',
    async () => {
      const res = await request(app)
        .get(`/outlines/${outlineId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      const body = res.body
      await tap.ok(body.id)
      await tap.equal(body.type, 'outline')
      // notes & noteRelations
      await tap.equal(body.notes.length, 6)
      const indexOfFirst = _.findIndex(body.notes, { shortId: note5.shortId })
      // 5 - 6 - 1 - 4
      await tap.equal(body.notes[indexOfFirst + 1].shortId, note6.shortId)
      await tap.equal(body.notes[indexOfFirst + 2].shortId, note1.shortId)
      await tap.equal(body.notes[indexOfFirst + 3].shortId, note4.shortId)
    }
  )

  // ------------------------------------- VALIDATION ERRORS ------------------------------------

  await tap.test('Try to create a Note without a body', async () => {
    const res = await request(app)
      .post(`/outlines/${outlineId}/notes`)
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
    await tap.equal(error.details.requestUrl, `/outlines/${outlineId}/notes`)
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.canonical, 'one')
  })

  await tap.test(
    'Try to create a Note with a body but no motivation',
    async () => {
      const res = await request(app)
        .post(`/outlines/${outlineId}/notes`)
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
      await tap.equal(error.details.requestUrl, `/outlines/${outlineId}/notes`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.canonical, 'one')
    }
  )

  await tap.test(
    'Try to create a Note for an Outline that does not exist',
    async () => {
      const res = await request(app)
        .post(`/outlines/${outlineId}abc/notes`)
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
        `Add Note to Outline Error: No Outline found with id: ${outlineId}abc`
      )
      await tap.equal(
        error.details.requestUrl,
        `/outlines/${outlineId}abc/notes`
      )
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.canonical, 'one')
    }
  )

  // copy existing note
  await tap.test('Copy an existing note to the context', async () => {
    const res = await request(app)
      .post(`/outlines/${outlineId}/notes?source=${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 201)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.notEqual(body.shortId, noteId)
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.contextId, outlineId)
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
      .post(`/outlines/${outlineId}/notes?source=${noteId}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(
      error.message,
      `Add Note to Outline Error: No Note found with id: ${noteId}abc`
    )
    await tap.equal(
      error.details.requestUrl,
      `/outlines/${outlineId}/notes?source=${noteId}abc`
    )
  })

  await tap.test(
    'Try to copy a note to an Outline that does not exist',
    async () => {
      const res = await request(app)
        .post(`/outlines/${outlineId}abc/notes?source=${noteId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.error, 'Not Found')
      await tap.equal(
        error.message,
        `Add Note to Outline Error: No Outline found with id: ${outlineId}abc`
      )
      await tap.equal(
        error.details.requestUrl,
        `/outlines/${outlineId}abc/notes?source=${noteId}`
      )
    }
  )

  await tap.test(
    'Try to add a note with a previous property pointing to a note that does not exist',
    async () => {
      const res = await request(app)
        .post(`/outlines/${outlineId}/notes`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            body: { motivation: 'test' },
            previous: note1.shortId + 'abc'
          })
        )

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.error, 'Not Found')
      await tap.equal(
        error.message,
        `Add Note to Outline Error: No Note found with for previous property: ${note1.shortId +
          'abc'}`
      )
      await tap.equal(error.details.requestUrl, `/outlines/${outlineId}/notes`)
      await tap.equal(error.details.requestBody.previous, note1.shortId + 'abc')
    }
  )

  await tap.test(
    'Try to add a note with a next property pointing to a note that does not exist',
    async () => {
      const res = await request(app)
        .post(`/outlines/${outlineId}/notes`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            body: { motivation: 'test' },
            next: note1.shortId + 'abc'
          })
        )

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.error, 'Not Found')
      await tap.equal(
        error.message,
        `Add Note to Outline Error: No Note found with for next property: ${note1.shortId +
          'abc'}`
      )
      await tap.equal(error.details.requestUrl, `/outlines/${outlineId}/notes`)
      await tap.equal(error.details.requestBody.next, note1.shortId + 'abc')
    }
  )

  await destroyDB(app)
}

module.exports = test
