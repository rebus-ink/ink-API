const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNoteContext,
  createNotebook
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerUrl = await createUser(app, token)
  const readerId = urlToId(readerUrl)

  let notebook = await createNotebook(app, token)

  await tap.test('Update name of notebook', async () => {
    const newNotebook = Object.assign(notebook, { name: 'new name' })

    const res = await request(app)
      .put(`/notebooks/${notebook.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newNotebook))

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.name, 'new name')
    await tap.ok(body.published)
    await tap.notEqual(body.updated, body.published)

    notebook = res.body
  })

  await tap.test('Update description', async () => {
    const newNotebook = Object.assign(notebook, {
      description: 'new description'
    })

    const res = await request(app)
      .put(`/notebooks/${notebook.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newNotebook))

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.name, 'new name')
    await tap.equal(body.description, 'new description')
    await tap.ok(body.published)
    await tap.notEqual(body.updated, body.published)

    notebook = res.body
  })

  await tap.test('Update status', async () => {
    const newNotebook = Object.assign(notebook, { status: 'archived' })

    const res = await request(app)
      .put(`/notebooks/${notebook.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newNotebook))

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.name, 'new name')
    await tap.equal(body.description, 'new description')
    await tap.equal(body.status, 'archived')
    await tap.ok(body.published)
    await tap.notEqual(body.updated, body.published)

    notebook = res.body
  })

  await tap.test('Update settings', async () => {
    const newNotebook = Object.assign(notebook, {
      settings: { property1: 'value1' }
    })

    const res = await request(app)
      .put(`/notebooks/${notebook.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newNotebook))

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.name, 'new name')
    await tap.equal(body.description, 'new description')
    await tap.equal(body.settings.property1, 'value1')
    await tap.ok(body.published)
    await tap.notEqual(body.updated, body.published)

    notebook = res.body
  })

  await tap.test('Update optional properties to null', async () => {
    const newNotebook = Object.assign(notebook, {
      description: null,
      settings: null
    })

    const res = await request(app)
      .put(`/notebooks/${notebook.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newNotebook))

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.ok(body.id)
    await tap.equal(urlToId(body.readerId), readerId)
    await tap.equal(body.name, 'new name')
    await tap.notOk(body.description)
    await tap.notOk(body.settings)
    await tap.ok(body.published)
    await tap.notEqual(body.updated, body.published)

    notebook = res.body
  })

  await tap.test('Try to remove the name property', async () => {
    const newNotebook = Object.assign(notebook, { name: null })

    const res = await request(app)
      .put(`/notebooks/${notebook.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newNotebook))

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      'Validation Error on Update Notebook: name: should be string'
    )
    await tap.equal(error.details.requestUrl, `/notebooks/${notebook.shortId}`)
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.name, null)
  })

  await tap.test('Try to update to an invalid value', async () => {
    const newNotebook = Object.assign(notebook, { name: 123 })

    const res = await request(app)
      .put(`/notebooks/${notebook.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newNotebook))

    await tap.equal(res.status, 400)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 400)
    await tap.equal(error.error, 'Bad Request')
    await tap.equal(
      error.message,
      'Validation Error on Update Notebook: name: should be string'
    )
    await tap.equal(error.details.requestUrl, `/notebooks/${notebook.shortId}`)
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.name, 123)
  })

  await tap.test('Try to update a notebook that does not exist', async () => {
    const newNotebook = Object.assign(notebook, {
      description: 'test',
      name: 'newer name'
    })

    const res = await request(app)
      .put(`/notebooks/${notebook.shortId}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(JSON.stringify(newNotebook))

    await tap.equal(res.status, 404)
    const error = JSON.parse(res.text)
    await tap.equal(
      error.message,
      `No Notebook found with id ${notebook.shortId}abc`
    )
    await tap.equal(
      error.details.requestUrl,
      `/notebooks/${notebook.shortId}abc`
    )
    await tap.type(error.details.requestBody, 'object')
    await tap.equal(error.details.requestBody.description, 'test')
  })

  await destroyDB(app)
}

module.exports = test
