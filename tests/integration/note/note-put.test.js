const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createNote,
  createNoteContext,
  createTag,
  createNotebook
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const source = await createSource(app, token)

  const sourceId = urlToId(source.id)

  const context = await createNoteContext(app, token)
  const contextId = context.shortId

  const note = await createNote(app, token, {
    body: { content: 'test content', motivation: 'test' },
    sourceId,
    document: 'doc123',
    json: { property: 'value' },
    contextId,
    canonical: '123'
  })
  const noteId = urlToId(note.id)

  const tag1 = await createTag(app, token, { name: 'tag1' })
  const tag2 = await createTag(app, token, { name: 'tag2' })
  const tag3 = await createTag(app, token, { name: 'tag3' })

  await tap.test('Update the content of a Note', async () => {
    const newNote = Object.assign(note, {
      body: { motivation: 'test', content: 'new content' }
    })

    const res = await request(app)
      .put(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newNote))

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.type(body.body[0].content, 'string')
    await tap.equal(body.body[0].content, 'new content')
    await tap.not(body.published, body.updated)
    // check that old properties are still there
    await tap.type(body.sourceId, 'string')
    await tap.equal(body.json.property, 'value')
    await tap.equal(body.contextId, contextId)
  })

  await tap.test('Update the target of a Note', async () => {
    const newNote = Object.assign(note, { target: { property1: 'something' } })

    const res = await request(app)
      .put(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newNote))

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.type(body.target.property1, 'string')
    await tap.equal(body.target.property1, 'something')
  })

  await tap.test('Update the document of a Note', async () => {
    const newNote = Object.assign(note, { document: 'doc456' })

    const res = await request(app)
      .put(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newNote))

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.type(body.target.property1, 'string')
    await tap.equal(body.target.property1, 'something')
    await tap.equal(body.document, 'doc456')
  })

  await tap.test('Remove the target of a Note', async () => {
    const newNote = Object.assign(note, { target: undefined })

    const res = await request(app)
      .put(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newNote))

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.notOk(body.target)
  })

  await tap.test('Remove the other properties of a Note', async () => {
    const newNote = Object.assign(note, {
      canonical: undefined,
      document: undefined,
      stylesheet: undefined,
      sourceId: undefined,
      contextId: undefined
    })

    const res = await request(app)
      .put(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newNote))

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.notOk(body.canonical)
    await tap.notOk(body.stylesheet)
    await tap.notOk(body.document)
    await tap.notOk(body.sourceId)
    await tap.notOk(body.contextId)
  })

  // ---------------------------- TAGS ----------------

  await tap.test('Update tags for a note - add tags', async () => {
    const newNote = Object.assign(note, {
      tags: [tag1, tag2]
    })

    const res = await request(app)
      .put(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newNote))

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.notOk(body.tags)

    const noteRes = await request(app)
      .get(`/notes/${body.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const noteBody = noteRes.body
    await tap.ok(noteBody.tags)
    await tap.equal(noteBody.tags.length, 2)
  })

  await tap.test('Update tags for a note - replace tags', async () => {
    const newNote = Object.assign(note, {
      tags: [tag2, tag3, { type: 'stack', name: 'tag4' }]
    })

    const res = await request(app)
      .put(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newNote))

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.notOk(body.tags)

    const noteRes = await request(app)
      .get(`/notes/${body.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const noteBody = noteRes.body
    await tap.ok(noteBody.tags)
    await tap.equal(noteBody.tags.length, 3)
  })

  await tap.test('Update tags for a note - ignore invalid tags', async () => {
    const newNote = Object.assign(note, {
      tags: [tag2, { id: tag3.id + 'abc', type: 'stack', name: 'invalid' }]
    })

    const res = await request(app)
      .put(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newNote))

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.notOk(body.tags)

    const noteRes = await request(app)
      .get(`/notes/${body.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const noteBody = noteRes.body
    await tap.ok(noteBody.tags)
    await tap.equal(noteBody.tags.length, 1)
  })

  await tap.test(
    'Update tags for a note - empty array = delete existing tags',
    async () => {
      const newNote = Object.assign(note, {
        tags: []
      })

      const res = await request(app)
        .put(`/notes/${noteId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(JSON.stringify(newNote))

      await tap.equal(res.statusCode, 200)
      const body = res.body
      await tap.notOk(body.tags)

      const noteRes = await request(app)
        .get(`/notes/${body.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const noteBody = noteRes.body
      await tap.ok(noteBody.tags)
      await tap.equal(noteBody.tags.length, 0)
    }
  )

  const notebook1 = await createNotebook(app, token, { name: 'notebook1' })
  const notebook2 = await createNotebook(app, token, { name: 'notebook2' })
  const notebook3 = await createNotebook(app, token, { name: 'notebook3' })
  // ---------------------------- NOTEBOOKS ----------------

  await tap.test('Update tags for a note - add notebooks', async () => {
    const newNote = Object.assign(note, {
      notebooks: [notebook1, notebook2],
      sourceId
    })
    const res = await request(app)
      .put(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newNote))

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.notOk(body.notebooks)

    const noteRes = await request(app)
      .get(`/notes/${body.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const noteBody = noteRes.body
    await tap.ok(noteBody.notebooks)
    await tap.equal(noteBody.notebooks.length, 2)

    const notebookRes = await request(app)
      .get(`/notebooks/${notebook1.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const notebooksBody = notebookRes.body
    await tap.equal(notebooksBody.notes.length, 1)
    await tap.equal(notebooksBody.sources.length, 1)
  })

  await tap.test('Update tags for a note - replace notebooks', async () => {
    const newNote = Object.assign(note, {
      notebooks: [notebook2, notebook3, { name: 'notebook4' }]
    })

    const res = await request(app)
      .put(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newNote))

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.notOk(body.notebooks)

    const noteRes = await request(app)
      .get(`/notes/${body.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const noteBody = noteRes.body
    await tap.ok(noteBody.notebooks)
    await tap.equal(noteBody.notebooks.length, 3)
  })

  await tap.test(
    'Update notebooks for a note - ignore invalid tags',
    async () => {
      const newNote = Object.assign(note, {
        notebooks: [notebook3, { id: notebook2.id + 'abc', name: 'notebook3' }]
      })

      const res = await request(app)
        .put(`/notes/${noteId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(JSON.stringify(newNote))

      await tap.equal(res.statusCode, 200)
      const body = res.body
      await tap.notOk(body.notebooks)

      const noteRes = await request(app)
        .get(`/notes/${body.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const noteBody = noteRes.body
      await tap.ok(noteBody.notebooks)
      await tap.equal(noteBody.notebooks.length, 1)
    }
  )

  await tap.test(
    'Update notebooks for a note - if no notebooks property, must not update notebooks',
    async () => {
      const newNote = Object.assign(note, {
        json: { property: 'something' }
      })

      const res = await request(app)
        .put(`/notes/${noteId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(JSON.stringify(newNote))

      await tap.equal(res.statusCode, 200)
      const body = res.body
      await tap.notOk(body.notebooks)

      const noteRes = await request(app)
        .get(`/notes/${body.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const noteBody = noteRes.body
      await tap.ok(noteBody.notebooks)
      await tap.equal(noteBody.notebooks.length, 1)
    }
  )

  await tap.test(
    'Update notebookss for a note - empty array = delete existing tags',
    async () => {
      const newNote = Object.assign(note, {
        notebooks: []
      })

      const res = await request(app)
        .put(`/notes/${noteId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(JSON.stringify(newNote))

      await tap.equal(res.statusCode, 200)
      const body = res.body
      await tap.notOk(body.notebooks)

      const noteRes = await request(app)
        .get(`/notes/${body.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const noteBody = noteRes.body
      await tap.ok(noteBody.notebooks)
      await tap.equal(noteBody.notebooks.length, 0)
    }
  )

  // ----------------------------------- VALIDATION ERRORS --------------

  await tap.test(
    'Try to update the target of a note to the wrong type',
    async () => {
      const newNote = Object.assign(note, { target: 'string!' })

      const res = await request(app)
        .put(`/notes/${noteId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(JSON.stringify(newNote))

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        `Validation Error on Update Note: target: must be object,null`
      )
      await tap.equal(error.details.requestUrl, `/notes/${noteId}`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.target, 'string!')
      await tap.type(error.details.validation, 'object')
      await tap.equal(error.details.validation.target[0].keyword, 'type')
      // await tap.equal(
      //   error.details.validation.target[0].params.type,
      //   ['object','null']
      // )
    }
  )

  await tap.test('Try to update by removing the body', async () => {
    const newNote = Object.assign(note, { target: undefined, body: undefined })

    const res = await request(app)
      .put(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newNote))

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      `Note Update Validation Error: body is a required property`
    )
    await tap.equal(error.details.requestUrl, `/notes/${noteId}`)
    await tap.type(error.details.requestBody, 'object')
  })

  await tap.test('Try to update by removing the motivation', async () => {
    const newNote = Object.assign(note, {
      target: undefined,
      body: { content: 'something' }
    })

    const res = await request(app)
      .put(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newNote))

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      `Note Validation Error: body.motivation is a required property`
    )
    await tap.equal(error.details.requestUrl, `/notes/${noteId}`)
    await tap.type(error.details.requestBody, 'object')
  })

  await tap.test(
    'Try to update a Note with an invalid motivation',
    async () => {
      const newNote = Object.assign(note, {
        body: { motivation: 'invalid motivation' }
      })
      const res = await request(app)
        .put(`/notes/${noteId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(JSON.stringify(newNote))

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        `Note Validation Error: invalid motivation is not a valid value for body.motivation`
      )
      await tap.equal(error.details.requestUrl, `/notes/${noteId}`)
      await tap.type(error.details.requestBody, 'object')
    }
  )

  await tap.test('Try to update a Note that does not exist', async () => {
    const res = await request(app)
      .put(`/notes/${noteId}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify(
          Object.assign(note, { target: { property: 'new target' } })
        )
      )
    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(
      error.message,
      `Put Note Error: No Note found with id ${noteId}abc`
    )
    await tap.equal(error.details.requestUrl, `/notes/${noteId}abc`)
    await tap.type(error.details.requestBody, 'object')
  })

  await destroyDB(app)
}

module.exports = test
