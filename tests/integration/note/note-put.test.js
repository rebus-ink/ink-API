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

  const createdDocument = await createDocument(readerId, publicationUrl)

  const documentUrl = `${publicationUrl}/${createdDocument.documentPath}`

  const note = await createNote(app, token, readerId, {
    body: { content: 'test content', motivation: 'test' },
    publicationId,
    documentUrl,
    json: { property: 'value' }
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
    await tap.type(body.body[0].content, 'string')
    await tap.equal(body.body[0].content, 'new content')
    await tap.notEqual(body.published, body.updated)
    // check that old properties are still there
    await tap.type(body.publicationId, 'string')
    await tap.type(body.documentUrl, 'string')
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
      await tap.equal(error.details.type, 'Note')
      await tap.equal(error.details.activity, 'Update Note')
      await tap.type(error.details.validation, 'object')
      await tap.equal(error.details.validation.target[0].keyword, 'type')
      await tap.equal(error.details.validation.target[0].params.type, 'object')
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
    await tap.equal(error.details.type, 'Note')
    await tap.equal(error.details.activity, 'Update Note')
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
      await tap.equal(error.statusCode, 400)
      await tap.equal(
        error.message,
        'invalid motivation is not a valid motivation'
      )
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(error.details.type, 'Note')
      await tap.equal(error.details.activity, 'Update Note')
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
    await tap.equal(error.details.type, 'Note')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Update Note')
  })

  await destroyDB(app)
}

module.exports = test
