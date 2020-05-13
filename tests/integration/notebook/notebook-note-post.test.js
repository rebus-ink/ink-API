const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNotebook
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerUrl = await createUser(app, token)
  const readerId = urlToId(readerUrl)

  const notebook = await createNotebook(app, token)
  const notebookId = notebook.shortId

  await tap.test('Create Note in Notebook', async () => {
    const res = await request(app)
      .post(`/notebooks/${notebookId}/notes`)
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

    // note should show up in notebook
    const resNotebook = await request(app)
      .get(`/notebooks/${notebookId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(resNotebook.body.notes.length, 1)
  })

  await tap.test(
    'Try to create a Note in a Notebook without a body',
    async () => {
      const res = await request(app)
        .post(`/notebooks/${notebookId}/notes`)
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
        `/notebooks/${notebookId}/notes`
      )
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.canonical, 'one')
    }
  )

  await tap.test(
    'Try to create a Note in a Notebook with an invalid json',
    async () => {
      const res = await request(app)
        .post(`/notebooks/${notebookId}/notes`)
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
        'Validation Error on Create Note: json: should be object,null'
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebookId}/notes`
      )
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.json, 'a string!')
      await tap.type(error.details.validation, 'object')
      await tap.equal(error.details.validation.json[0].keyword, 'type')
      await tap.equal(
        error.details.validation.json[0].params.type,
        'object,null'
      )
    }
  )

  await tap.test(
    'Try to create a Note for a Notebook that does not exist',
    async () => {
      const resNotesBefore = await request(app)
        .get(`/notes`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      const numberOfNotesBefore = resNotesBefore.body.items.length

      const res = await request(app)
        .post(`/notebooks/${notebookId}abc/notes`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            body: {
              content: 'testing!',
              motivation: 'test'
            }
          })
        )

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `Create Note Error: No Notebook found with id: ${notebookId}abc`
      )
      await tap.equal(
        error.details.requestUrl,
        `/notebooks/${notebookId}abc/notes`
      )

      // note should note exist

      const resNotesAfter = await request(app)
        .get(`/notes`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(resNotesAfter.body.items.length, numberOfNotesBefore)
    }
  )

  await destroyDB(app)
}

module.exports = test
