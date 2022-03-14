const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createTag,
  createNotebook
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')
const _ = require('lodash')

const test = async app => {
  const token = getToken()
  const readerUrl = await createUser(app, token)
  const readerId = urlToId(readerUrl)

  const source = await createSource(app, token)
  const sourceId = urlToId(source.id)
  const sourceUrl = source.id

  // source2
  await createSource(app, token)

  const tag1 = await createTag(app, token, { name: 'tag1' })
  const tag2 = await createTag(app, token, { name: 'tag2' })

  await tap.test('Create Note with single body', async () => {
    const res = await request(app)
      .post('/notes')
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
      .post('/notes')
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
      .post('/notes')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          body: {
            content: 'this is the content of the note',
            motivation: 'test'
          },
          sourceId,
          document: 'doc123'
        })
      )
    await tap.equal(res.status, 201)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.ok(body.published)
    await tap.ok(body.body)
    await tap.ok(body.body[0].content)
    await tap.equal(body.body[0].motivation, 'test')
    await tap.equal(urlToId(body.sourceId), sourceId)
    await tap.equal(body.document, 'doc123')
  })

  await tap.test('Note with sourceId must be attached to source', async () => {
    const res = await request(app)
      .get(`/sources/${urlToId(sourceUrl)}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.ok(res.body)
    await tap.equal(res.body.replies.length, 1)
  })

  await tap.test(
    'All notes created must show up in the list of notes',
    async () => {
      const res = await request(app)
        .get(`/notes`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
      await tap.equal(res.body.totalItems, 3)
    }
  )

  // ------------------------------ WITH TAGS -----------------------

  await tap.test('Create Note with existing tags', async () => {
    const res = await request(app)
      .post('/notes')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          body: {
            content: 'this is the content of the note',
            motivation: 'test'
          },
          tags: [tag1, tag2]
        })
      )

    const body = res.body
    await tap.ok(body)
    await tap.notOk(body.tags)

    const noteRes = await request(app)
      .get(`/notes/${body.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const note = noteRes.body
    await tap.ok(note.tags)
    await tap.equal(note.tags.length, 2)
  })

  await tap.test('Create Note with existing and new tags', async () => {
    const res = await request(app)
      .post('/notes')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          body: {
            content: 'this is the content of the note',
            motivation: 'test'
          },
          tags: [
            tag1,
            { name: 'tag3', type: 'stack' },
            { name: 'tag4', type: 'stack' }
          ]
        })
      )

    const body = res.body
    await tap.notOk(body.tags)

    const noteRes = await request(app)
      .get(`/notes/${body.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const note = noteRes.body
    await tap.ok(note.tags)
    await tap.equal(note.tags.length, 3)
  })

  await tap.test(
    'Create Note with existing and tag with invalid id',
    async () => {
      const res = await request(app)
        .post('/notes')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            body: {
              content: 'this is the content of the note',
              motivation: 'test'
            },
            tags: [tag1, { name: 'invalidTag' }]
          })
        )

      const body = res.body
      await tap.notOk(body.tags)

      const noteRes = await request(app)
        .get(`/notes/${body.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const note = noteRes.body
      await tap.ok(note.tags)
      await tap.equal(note.tags.length, 1)
    }
  )

  await tap.test('Create Note with existing and invalid tags', async () => {
    const res = await request(app)
      .post('/notes')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          body: {
            content: 'this is the content of the note',
            motivation: 'test'
          },
          tags: [
            tag1,
            { id: tag2.id + 'abc', type: 'stack', name: 'invalidTag' }
          ]
        })
      )

    const body = res.body
    await tap.notOk(body.tags)

    const noteRes = await request(app)
      .get(`/notes/${body.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const note = noteRes.body
    await tap.ok(note.tags)
    await tap.equal(note.tags.length, 1)
  })

  // ------------------------------ WITH NOTEBOOKS -----------------------

  const notebook1 = await createNotebook(app, token, { name: 'notebook1' })
  const notebook2 = await createNotebook(app, token, { name: 'notebook2' })
  let notebook3Id

  await tap.test('Create Note with existing notebooks', async () => {
    const res = await request(app)
      .post('/notes')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          body: {
            content: 'this is the content of the note',
            motivation: 'test'
          },
          sourceId,
          notebooks: [notebook1, notebook2]
        })
      )

    const body = res.body
    await tap.ok(body)
    await tap.notOk(body.notebooks)

    const noteRes = await request(app)
      .get(`/notes/${body.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const note = noteRes.body
    await tap.ok(note.notebooks)
    await tap.equal(note.notebooks.length, 2)

    const notebookRes = await request(app)
      .get(`/notebooks/${notebook1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const notebookBody = notebookRes.body
    await tap.equal(notebookBody.notes.length, 1)
    await tap.equal(notebookBody.sources.length, 1)
  })

  await tap.test('Create Note with existing and new notebooks', async () => {
    const res = await request(app)
      .post('/notes')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          body: {
            content: 'this is the content of the note',
            motivation: 'test'
          },
          notebooks: [notebook1, { name: 'notebook3' }, { name: 'notebook4' }]
        })
      )

    const body = res.body
    await tap.notOk(body.notebooks)

    const noteRes = await request(app)
      .get(`/notes/${body.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const note = noteRes.body
    await tap.ok(note.notebooks)
    await tap.equal(note.notebooks.length, 3)

    const notebook3 = _.find(note.notebooks, { name: 'notebook3' })
    notebook3Id = notebook3.shortId
  })

  await tap.test(
    'Create Note with existing and notebook with invalid id',
    async () => {
      const res = await request(app)
        .post('/notes')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            body: {
              content: 'this is the content of the note',
              motivation: 'test'
            },
            notebooks: [notebook1, { id: notebook2.shortId + 'abc' }]
          })
        )

      const body = res.body
      await tap.notOk(body.notebooks)

      const noteRes = await request(app)
        .get(`/notes/${body.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const note = noteRes.body
      await tap.ok(note.notebooks)
      await tap.equal(note.notebooks.length, 1)
    }
  )

  await tap.test(
    'Create Note with existing and invalid notebooks',
    async () => {
      const res = await request(app)
        .post('/notes')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            body: {
              content: 'this is the content of the note',
              motivation: 'test'
            },
            notebooks: [
              notebook1,
              { status: 'test' } // missing name
            ]
          })
        )

      const body = res.body
      await tap.notOk(body.notebooks)

      const noteRes = await request(app)
        .get(`/notes/${body.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const note = noteRes.body
      await tap.ok(note.notebooks)
      await tap.equal(note.notebooks.length, 1)
    }
  )

  await tap.test('Created Notebooks can be deleted', async () => {
    const res = await request(app)
      .delete(`/notebooks/${notebook3Id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 204)
  })

  // ------------------------------------- VALIDATION ERRORS ------------------------------------

  await tap.test('Try to create a Note without a body', async () => {
    const res = await request(app)
      .post('/notes')
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
    await tap.equal(error.details.requestUrl, `/notes`)
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.canonical, 'one')
  })

  await tap.test(
    'Try to create a Note with a body but no motivation',
    async () => {
      const res = await request(app)
        .post('/notes')
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
      await tap.equal(error.details.requestUrl, `/notes`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.canonical, 'one')
    }
  )

  await tap.test('Note with invalid body should not exist', async () => {
    const res = await request(app)
      .get(`/notes`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.body.totalItems, 11)
  })

  await tap.test('Try to create a Note with an invalid json', async () => {
    const res = await request(app)
      .post('/notes')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          body: {
            content: 'testing!',
            motivation: 'test'
          },
          json: 'a string!'
        })
      )

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      'Validation Error on Create Note: json: must be object,null'
    )
    await tap.equal(error.details.requestUrl, `/notes`)
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.json, 'a string!')
    await tap.type(error.details.validation, 'object')
    await tap.equal(error.details.validation.json[0].keyword, 'type')
    // await tap.equal(error.details.validation.json[0].params.type, ['object','null'])
  })

  await tap.test(
    'Try to create a Note with an invalid motivation',
    async () => {
      const res = await request(app)
        .post('/notes')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            body: {
              content: 'testing!',
              motivation: 'invalid motivation'
            }
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(
        error.message,
        'Note Validation Error: invalid motivation is not a valid value for body.motivation'
      )
      await tap.equal(error.details.requestUrl, `/notes`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.body.content, 'testing!')
      await tap.equal(error.error, 'Bad Request')
    }
  )

  // // ---------------------------------------- OTHER ERRORS -----------------------------------

  await tap.test('Try to create Note with invalid Source id', async () => {
    const res = await request(app)
      .post('/notes')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          body: { motivation: 'test' },
          sourceId: sourceId + 'abc'
        })
      )

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(
      error.message,
      `Create Note Error: No Source found with id: ${sourceId}abc`
    )
    await tap.equal(error.details.requestUrl, `/notes`)
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.body.motivation, 'test')
  })

  await tap.test(
    'None of the error scenario should have created a note',
    async () => {
      const res = await request(app)
        .get(`/notes`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
      await tap.equal(res.body.totalItems, 11)
    }
  )

  await destroyDB(app)
}

module.exports = test
