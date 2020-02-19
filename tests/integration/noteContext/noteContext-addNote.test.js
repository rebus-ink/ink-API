const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createDocument,
  createNoteContext
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerUrl = await createUser(app, token)
  const readerId = urlToId(readerUrl)

  const publication = await createPublication(readerId)
  const publicationId = urlToId(publication.id)
  const publicationUrl = publication.id

  const publication2 = await createPublication(readerId)
  const publicationId2 = urlToId(publication2.id)

  const createdDocument = await createDocument(readerId, publicationUrl)

  const documentUrl = `${publicationUrl}/${createdDocument.documentPath}`

  const context = await createNoteContext(app, token, {
    type: 'test',
    name: 'my context'
  })
  const contextId = context.id

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

  await tap.test('Create Note with documentUrl and publicationId', async () => {
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
          publicationId,
          documentUrl
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
    await tap.equal(body.documentUrl, documentUrl)
    await tap.equal(urlToId(body.publicationId), publicationId)
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

  await destroyDB(app)
}

module.exports = test
