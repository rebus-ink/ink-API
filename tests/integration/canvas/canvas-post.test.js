const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNotebook
} = require('../../utils/testUtils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const notebook = await createNotebook(app, token, { name: 'notebook1' })

  await tap.test('Create a simple Canvas', async () => {
    const res = await request(app)
      .post(`/canvas`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'canvas1',
          notebookId: notebook.shortId
        })
      )

    await tap.equal(res.status, 201)

    const body = res.body
    await tap.equal(body.name, 'canvas1')
    await tap.ok(body.id)
    await tap.ok(body.shortId)
    await tap.ok(body.notebookId)
    await tap.equal(body.notebookId, notebook.shortId)
    await tap.ok(body.published)
    await tap.ok(body.updated)
  })

  await tap.test('Create a Canvas with optional properties', async () => {
    const res = await request(app)
      .post(`/canvas`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'canvas1',
          notebookId: notebook.shortId,
          json: { property: 'value' },
          settings: { property: 'value2' },
          description: 'this is a canvas'
        })
      )

    await tap.equal(res.status, 201)

    const body = res.body
    await tap.equal(body.name, 'canvas1')
    await tap.ok(body.notebookId)
    await tap.equal(body.notebookId, notebook.shortId)
    await tap.equal(body.json.property, 'value')
    await tap.equal(body.settings.property, 'value2')
    await tap.equal(body.description, 'this is a canvas')
  })

  await tap.test('invalid properties should be ignored', async () => {
    const res = await request(app)
      .post(`/canvas`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'canvas1',
          notebookId: notebook.shortId,
          invalidProp: 'blah blah'
        })
      )

    await tap.equal(res.status, 201)

    const body = res.body
    await tap.equal(body.name, 'canvas1')
    await tap.notOk(body.invalidProp)
  })

  // await tap.test('created canvas should be in the canvas list', async () => {
  //   const res = await request(app)
  //     .get(`/canvas`)
  //     .set('Host', 'reader-api.test')
  //     .set('Authorization', `Bearer ${token}`)
  //     .type('application/ld+json')
  //   await tap.equal(res.status, 200)
  //   const body = res.body

  // })

  await tap.test('trying to create a Canvas without a notebookId', async () => {
    const res = await request(app)
      .post(`/canvas`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          name: 'something'
        })
      )

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      'Validation Error on Create Canvas: notebookId: is a required property'
    )
    await tap.type(error.details.validation, 'object')
    await tap.equal(error.details.validation.notebookId[0].keyword, 'required')
    await tap.equal(
      error.details.validation.notebookId[0].params.missingProperty,
      'notebookId'
    )
    await tap.equal(error.details.requestUrl, '/canvas')
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.name, 'something')
  })

  await tap.test('Try to create a Canvas with an invalid json', async () => {
    const res = await request(app)
      .post(`/canvas`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          notebookId: notebook.shortId,
          name: 'canvas1',
          json: 'a string'
        })
      )

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.type(error.details.validation, 'object')
    await tap.equal(error.details.validation.json[0].keyword, 'type')
    await tap.equal(error.details.validation.json[0].params.type, 'object,null')
    await tap.equal(
      error.message,
      'Validation Error on Create Canvas: json: should be object,null'
    )
    await tap.equal(error.details.requestUrl, '/canvas')
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.name, 'canvas1')
  })

  await tap.test(
    'Try to create a Source with an invalid notebookId',
    async () => {
      const res = await request(app)
        .post(`/canvas`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(
          JSON.stringify({
            name: 'canvas2',
            notebookId: notebook.shortId + 'abc'
          })
        )

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        `Canvas creation error: No Notebook found with id ${
          notebook.shortId
        }abc`
      )
      await tap.equal(error.details.requestUrl, '/canvas')
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.name, 'canvas2')
    }
  )

  await tap.test('Try to create a Canvas without a body', async () => {
    const res = await request(app)
      .post('/canvas')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      `Create Canvas Error: Request body must be a JSON object`
    )
    await tap.equal(error.details.requestUrl, '/canvas')
  })

  await destroyDB(app)
}

module.exports = test
