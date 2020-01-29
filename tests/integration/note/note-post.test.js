const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createDocument
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
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.json.property1, 'value1')
    await tap.ok(body.published)
    await tap.ok(body.body)
    await tap.ok(body.body[0].content)
    await tap.equal(body.body[0].motivation, 'test')
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

  await tap.test('Create Note with documentUrl', async () => {
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
          publicationId,
          documentUrl
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
    await tap.equal(body.documentUrl, documentUrl)
    await tap.equal(urlToId(body.publicationId), publicationId)
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
    await tap.equal(error.details.type, 'Note')
    await tap.equal(error.details.activity, 'Create Note')
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
      await tap.equal(error.message, 'body.motivation is a required property')
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(error.details.type, 'Note')
      await tap.equal(error.details.activity, 'Create Note')
    }
  )

  await tap.test('Note with invalid body should not exist', async () => {
    const res = await request(app)
      .get(`/notes`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.body.totalItems, 3)
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
    await tap.equal(error.details.type, 'Note')
    await tap.equal(error.details.activity, 'Create Note')
    await tap.type(error.details.validation, 'object')
    await tap.equal(error.details.validation.json[0].keyword, 'type')
    await tap.equal(error.details.validation.json[0].params.type, 'object')
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
        'invalid motivation is not a valid motivation'
      )
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(error.details.type, 'Note')
      await tap.equal(error.details.activity, 'Create Note')
    }
  )

  // // ---------------------------------------- OTHER ERRORS -----------------------------------

  await tap.test('Try to create Note with invalid document url', async () => {
    const res = await request(app)
      .post('/notes')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          target: { property: 'something' },
          publicationId,
          documentUrl: documentUrl + 'abc'
        })
      )
    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(error.details.type, 'Document')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Create Note')
  })

  await tap.test('Try to create Note with invalid Publication id', async () => {
    const res = await request(app)
      .post('/notes')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          body: { motivation: 'test' },
          publicationId: publicationId + 'abc'
        })
      )

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(error.details.type, 'Publication')
    await tap.type(error.details.id, 'string')
    await tap.equal(error.details.activity, 'Create Note')
  })

  await tap.test(
    'Try to create Note with a documentUrl but no publicationId',
    async () => {
      const res = await request(app)
        .post('/notes')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            target: { property: 'something' },
            documentUrl: documentUrl
          })
        )
      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.details.type, 'Document')
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(error.details.activity, 'Create Note')
    }
  )

  await tap.test(
    'Try to create Note with a documentUrl buta publicationId for another publication',
    async () => {
      const res = await request(app)
        .post('/notes')
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            target: { property: 'something' },
            documentUrl: documentUrl,
            publicationId: publicationId2
          })
        )
      // should return a document not found error
      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.details.type, 'Document')
      await tap.equal(error.details.activity, 'Create Note')
    }
  )

  await destroyDB(app)
}

module.exports = test
