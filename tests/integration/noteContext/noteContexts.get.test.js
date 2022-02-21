const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNotebook,
  createNoteContext
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const notebook = await createNotebook(app, token, { name: 'notebook1' })
  const notebook2 = await createNotebook(app, token, {name: 'notebook2'})

  await tap.test('Get NoteContexts for a reader with no noteContexts', async () => {
    const res = await request(app)
      .get('/noteContexts')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 0)
    await tap.equal(res.body.totalItems, 0)
  })

  await createNoteContext(app, token, {
    name: 'outline1',
    description: 'description1',
    notebookId: notebook.shortId
  })
  await createNoteContext(app, token, {
    name: 'outline2',
    description: 'description2',
    notebookId: notebook2.shortId
  })

  await tap.test('Get NoteContexts', async () => {
    const res = await request(app)
      .get('/noteContexts')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 2)
    await tap.equal(res.body.totalItems, 2)

    const body = res.body.items[0]
    await tap.ok(body.id)
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.ok(body.name)
    await tap.ok(body.description)
    await tap.ok(body.published)
    await tap.ok(body.updated)
  })

  await tap.test('Get NoteContexts filtered by notebook', async () => {
    const res = await request(app)
      .get(`/noteContexts?notebook=${notebook2.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 1)
    await tap.equal(res.body.totalItems, 1)

    const body = res.body.items[0]
    await tap.ok(body.id)
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.ok(body.name)
    await tap.ok(body.description)
    await tap.ok(body.published)
    await tap.ok(body.updated)
    await tap.equal(body.notebookId, notebook2.shortId)
  })

  await destroyDB(app)
}

module.exports = test
