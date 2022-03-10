const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNoteContext
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerUrl = await createUser(app, token)
  const readerId = urlToId(readerUrl)

  const noteContext = await createNoteContext(app, token)

  await tap.test('Update type of NoteContext', async () => {
    const res = await request(app)
      .put(`/noteContexts/${noteContext.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify({ type: 'test2' }))

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.type, 'test2')
    await tap.ok(body.published)
    await tap.notEqual(body.updated, body.published)
  })

  await tap.test('Update name and description of NoteContext', async () => {
    const res = await request(app)
      .put(`/noteContexts/${noteContext.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          type: 'test2',
          name: 'something',
          description: 'description!'
        })
      )

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.type, 'test2')
    await tap.equal(body.name, 'something')
    await tap.equal(body.description, 'description!')
    await tap.ok(body.published)
    await tap.notEqual(body.updated, body.published)
  })

  await tap.test('Update name and description to null', async () => {
    const res = await request(app)
      .put(`/noteContexts/${noteContext.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify({ type: 'test2', name: null, description: null }))

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.type, 'test2')
    await tap.notOk(body.name)
    await tap.notOk(body.description)
    await tap.ok(body.published)
    await tap.notEqual(body.updated, body.published)
  })

  await tap.test('Try to remove the type property', async () => {
    const res = await request(app)
      .put(`/noteContexts/${noteContext.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify({ type: null }))

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      'Validation Error on Update NoteContext: type: must be string'
    )
    await tap.equal(
      error.details.requestUrl,
      `/noteContexts/${noteContext.shortId}`
    )
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.type, null)
  })

  await tap.test(
    'Try to update a noteContext that does not exist',
    async () => {
      const res = await request(app)
        .put(`/noteContexts/${noteContext.shortId}abc`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(JSON.stringify({ type: 'test3' }))

      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(
        error.message,
        `No NoteContext found with id ${noteContext.shortId}abc`
      )
      await tap.equal(
        error.details.requestUrl,
        `/noteContexts/${noteContext.shortId}abc`
      )
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.type, 'test3')
    }
  )

  await destroyDB(app)
}

module.exports = test
