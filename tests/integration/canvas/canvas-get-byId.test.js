const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  createNotebook,
  createNoteContext,
  createCanvas
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')
const _ = require('lodash')
const { toPairs } = require('lodash')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const notebook = await createNotebook(app, token, { name: 'notebook1' })
  const canvas = await createCanvas(app, token, {
    notebookId: notebook.shortId,
    name: 'canvas1',
    description: 'this is a canvas',
    settings: { property: 'value1' },
    json: { property: 'value2' }
  })

  await tap.test('Get Canvas', async () => {
    const res = await request(app)
      .get(`/canvas/${canvas.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.ok(body.shortId)
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.equal(body.name, 'canvas1')
    await tap.equal(body.description, 'this is a canvas')
    await tap.equal(body.settings.property, 'value1')
    await tap.equal(body.json.property, 'value2')
    await tap.ok(body.published)
    await tap.ok(body.updated)
    await tap.ok(body.readerId)
    // should include notebook information
    await tap.ok(body.notebook)
    await tap.equal(body.notebook.name, 'notebook1')
    await tap.ok(body.notebook.id)
    await tap.ok(body.notebook.shortId)
  })

  await tap.test('Get Canvas from id url', async () => {
    const res = await request(app)
      .get(urlparse(canvas.id).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.ok(body.shortId)
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.equal(body.name, 'canvas1')
    await tap.equal(body.description, 'this is a canvas')
    await tap.equal(body.settings.property, 'value1')
    await tap.equal(body.json.property, 'value2')
    await tap.ok(body.published)
    await tap.ok(body.updated)
    await tap.ok(body.readerId)
    // should include notebook information
    await tap.ok(body.notebook)
    await tap.equal(body.notebook.name, 'notebook1')
    await tap.ok(body.notebook.id)
    await tap.ok(body.notebook.shortId)
  })

  await tap.test('Get Canvas with NoteContext', async () => {
    const context = await createNoteContext(app, token, {
      name: 'context1',
      type: 'outline',
      canvasId: canvas.shortId
    })

    const res = await request(app)
      .get(`/canvas/${canvas.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.ok(body.shortId)
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.equal(body.name, 'canvas1')
    await tap.equal(body.description, 'this is a canvas')
    await tap.equal(body.settings.property, 'value1')
    await tap.equal(body.json.property, 'value2')
    await tap.ok(body.published)
    await tap.ok(body.updated)
    await tap.ok(body.readerId)
    // should include notebook information
    await tap.ok(body.notebook)
    await tap.equal(body.notebook.name, 'notebook1')
    await tap.ok(body.notebook.id)
    await tap.ok(body.notebook.shortId)
    // should include noteContext information
    await tap.ok(body.noteContexts)
    await tap.equal(body.noteContexts.length, 1)
    await tap.equal(body.noteContexts[0].id, context.id)
    await tap.equal(body.noteContexts[0].name, 'context1')
  })

  await tap.test('Try to get Canvas that does not exist', async () => {
    const res = await request(app)
      .get(`/canvas/${canvas.shortId}123`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(
      error.message,
      `Get Canvas Error: No Canvas found with id ${canvas.shortId}123`
    )
    await tap.equal(error.details.requestUrl, `/canvas/${canvas.shortId}123`)
  })

  await destroyDB(app)
}

module.exports = test
