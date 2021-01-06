const request = require('supertest')
const tap = require('tap')
const { getToken, createUser, destroyDB } = require('../../utils/testUtils')
const app = require('../../../server').app
const { urlToId } = require('../../../utils/utils')
const { NoteContext } = require('../../../models/NoteContext')

const { Notebook } = require('../../../models/Notebook')
const { Canvas } = require('../../../models/Canvas')
const _ = require('lodash')

const test = async () => {
  const token = getToken()
  const reader = await createUser(app, token)
  const readerId = urlToId(reader)

  // 25 hours ago
  const timestamp25 = new Date(Date.now() - 90000 * 1000).toISOString()
  // now
  const timestampNow = new Date(Date.now()).toISOString()

  const notebook1 = await Notebook.query().insertAndFetch({
    name: 'notebook1',
    readerId,
    status: 1
  })

  const notebook2 = await Notebook.query().insertAndFetch({
    name: 'notebook2',
    readerId,
    status: 1,
    deleted: timestamp25
  })

  // create canvas
  // deleted
  const canvas1 = await Canvas.query().insertAndFetch({
    readerId,
    notebookId: urlToId(notebook1.id),
    name: 'canvas1',
    description: 'jsoiwerwhaoiere',
    deleted: timestamp25
  })
  const canvas2 = await Canvas.query().insertAndFetch({
    readerId,
    notebookId: urlToId(notebook1.id),
    name: 'canvas2',
    description: 'jsoiwerwhaoiere',
    deleted: timestamp25
  })

  // not deleted, but notebook deleted
  const canvas3 = await Canvas.query().insertAndFetch({
    readerId,
    notebookId: urlToId(notebook2.id),
    name: 'canvas3',
    description: 'jsoiwerwhaoiere'
  })

  // deleted recently
  const canvas4 = await Canvas.query().insertAndFetch({
    readerId,
    notebookId: urlToId(notebook1.id),
    name: 'canvas4',
    description: 'jsoiwerwhaoiere',
    deleted: timestampNow
  })
  const canvas5 = await Canvas.query().insertAndFetch({
    readerId,
    notebookId: urlToId(notebook1.id),
    name: 'canvas5',
    description: 'jsoiwerwhaoiere',
    deleted: timestampNow
  })

  // not deleted
  const canvas6 = await Canvas.query().insertAndFetch({
    readerId,
    notebookId: urlToId(notebook1.id),
    name: 'canvas6',
    description: 'jsoiwerwhaoiere'
  })

  // create noteContexts

  // deleted canvas
  await NoteContext.query().insertAndFetch({
    type: 'test',
    readerId,
    notebookId: urlToId(notebook1.id),
    canvasId: urlToId(canvas1.id)
  })

  await NoteContext.query().insertAndFetch({
    type: 'test',
    readerId,
    notebookId: urlToId(notebook1.id),
    canvasId: urlToId(canvas1.id)
  })

  // not deleted canvas
  const context3 = await NoteContext.query().insertAndFetch({
    type: 'test',
    readerId,
    notebookId: urlToId(notebook1.id),
    canvasId: urlToId(canvas6.id)
  })

  await tap.test('Before hard delete', async () => {
    const canvases = await Canvas.query()
    await tap.equal(canvases.length, 6)

    const contexts = await NoteContext.query()
    await tap.equal(contexts.length, 3)
  })

  await tap.test('Hard Delete', async () => {
    const res = await request(app)
      .delete('/hardDelete')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.status, 204)

    const canvases = await Canvas.query()
    await tap.equal(canvases.length, 3)
    await tap.notOk(_.find(canvases, { id: canvas1.id }))
    await tap.notOk(_.find(canvases, { id: canvas2.id }))
    await tap.notOk(_.find(canvases, { id: canvas3.id }))
    await tap.ok(_.find(canvases, { id: canvas4.id }))
    await tap.ok(_.find(canvases, { id: canvas5.id }))
    await tap.ok(_.find(canvases, { id: canvas5.id }))

    const contexts = await NoteContext.query()
    await tap.equal(contexts.length, 1)
    await tap.equal(contexts[0].id, context3.id)
  })

  await destroyDB(app)
}

module.exports = test
