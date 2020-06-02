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

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const source = await createSource(app, token)

  const sourceId = urlToId(source.id)

  const note = await createNote(app, token, {
    body: { content: 'test content', motivation: 'test' },
    sourceId,
    document: 'doc123',
    json: { property: 'value' },
    canonical: '123'
  })
  const noteId = urlToId(note.id)

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
    await tap.notEqual(body.published, body.updated)
    // check that old properties are still there
    await tap.type(body.sourceId, 'string')
    await tap.equal(body.json.property, 'value')
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
      stylesheet: undefined /* sourceId: undefined */
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
    // await tap.notOk(body.sourceId)
  })

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
        `Validation Error on Update Note: target: should be object,null`
      )
      await tap.equal(error.details.requestUrl, `/notes/${noteId}`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.target, 'string!')
      await tap.type(error.details.validation, 'object')
      await tap.equal(error.details.validation.target[0].keyword, 'type')
      await tap.equal(
        error.details.validation.target[0].params.type,
        'object,null'
      )
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
