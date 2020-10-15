const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createNote,
  createTag,
  createCanvas,
  createNotebook
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const notebook1 = await createNotebook(app, token, { name: 'notebook1' })
  const notebook2 = await createNotebook(app, token, { name: 'notebook2' })
  let canvas = await createCanvas(app, token, { notebookId: notebook1.shortId })

  await tap.test('Update the name of a canvas', async () => {
    const newCanvas = Object.assign(canvas, { name: 'canvas1' })

    const res = await request(app)
      .put(`/canvas/${canvas.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newCanvas))

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.equal(body.name, 'canvas1')
    await tap.notEqual(body.published, body.updated)
    // check that old properties are still there
    await tap.type(body.notebookId, 'string')

    canvas = body
  })

  await tap.test(
    'Update the name of a canvas by setting it to null',
    async () => {
      const newCanvas = Object.assign(canvas, { name: null })

      const res = await request(app)
        .put(`/canvas/${canvas.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(JSON.stringify(newCanvas))

      await tap.equal(res.statusCode, 200)
      const body = res.body
      await tap.type(body, 'object')
      await tap.type(body.id, 'string')
      await tap.equal(body.shortId, urlToId(body.id))
      await tap.notOk(body.name)
      await tap.notEqual(body.published, body.updated)
      // check that old properties are still there
      await tap.type(body.notebookId, 'string')

      canvas = body
    }
  )

  await tap.test('Update the description, json and settings', async () => {
    const newCanvas = Object.assign(canvas, {
      description: 'something',
      settings: { property: 'value' },
      json: { property: 'value2' }
    })

    const res = await request(app)
      .put(`/canvas/${canvas.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newCanvas))

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.notOk(body.name)
    await tap.equal(body.description, 'something')
    await tap.equal(body.settings.property, 'value')
    await tap.equal(body.json.property, 'value2')
    await tap.notEqual(body.published, body.updated)
    // check that old properties are still there
    await tap.type(body.notebookId, 'string')

    canvas = body
  })

  await tap.test('Update the notebookId', async () => {
    const newCanvas = Object.assign(canvas, { notebookId: notebook2.shortId })

    const res = await request(app)
      .put(`/canvas/${canvas.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newCanvas))

    await tap.equal(res.statusCode, 200)
    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.notOk(body.name)
    await tap.equal(body.description, 'something')
    await tap.equal(body.settings.property, 'value')
    await tap.equal(body.json.property, 'value2')
    await tap.notEqual(body.published, body.updated)
    // check that old properties are still there
    await tap.type(body.notebookId, 'string')
    await tap.equal(body.notebookId, notebook2.shortId)

    canvas = body
  })

  // // ----------------------------------- VALIDATION ERRORS --------------

  await tap.test(
    'Try to update the name of a canvas to the wrong type',
    async () => {
      const newCanvas = Object.assign(canvas, { name: 123 })

      const res = await request(app)
        .put(`/canvas/${canvas.shortId}`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
        .send(JSON.stringify(newCanvas))

      await tap.equal(res.status, 400)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 400)
      await tap.equal(error.error, 'Bad Request')
      await tap.equal(
        error.message,
        `Validation Error on Update Canvas: name: should be string,null`
      )
      await tap.equal(error.details.requestUrl, `/canvas/${canvas.shortId}`)
      await tap.type(error.details.requestBody, 'object')
      await tap.equal(error.details.requestBody.name, 123)
      await tap.type(error.details.validation, 'object')
      await tap.equal(error.details.validation.name[0].keyword, 'type')
      await tap.equal(
        error.details.validation.name[0].params.type,
        'string,null'
      )
    }
  )

  await tap.test('Try to update by removing the notebookId', async () => {
    const newCanvas = Object.assign(canvas, {
      name: 'new name',
      notebookId: null
    })
    const res = await request(app)
      .put(`/canvas/${canvas.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newCanvas))

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      'Validation Error on Update Canvas: notebookId is a required property'
    )
    await tap.equal(error.details.requestUrl, `/canvas/${canvas.shortId}`)
    await tap.type(error.details.requestBody, 'object')
  })

  await tap.test('Try to update a Canvas that does not exist', async () => {
    const res = await request(app)
      .put(`/canvas/${canvas.shortId}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify(
          Object.assign(canvas, {
            name: 'new name',
            notebookId: notebook2.shortId
          })
        )
      )
    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(
      error.message,
      `Put Canvas Error: No Canvas found with id ${canvas.shortId}abc`
    )
    await tap.equal(error.details.requestUrl, `/canvas/${canvas.shortId}abc`)
    await tap.type(error.details.requestBody, 'object')
  })

  await destroyDB(app)
}

module.exports = test
