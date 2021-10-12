const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createNote,
  createTag,
  addSourceToCollection,
  createNotebook,
  addSourceToNotebook,
  createReadActivity
} = require('../../utils/testUtils')
const app = require('../../../server').app

const test = async () => {
  const token = getToken()
  await createUser(app, token)

  await tap.test('Search empty collections', async () => {
    const res = await request(app)
      .post('/search')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          search: 'target',
          includeNotes: true,
          includeSources: true,
          includeNotebooks: true
        })
      )

    await tap.equal(res.status, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.ok(body.notes)
    await tap.type(body.notes.totalItems, 'number')
    await tap.equal(body.notes.totalItems, 0)
    await tap.ok(Array.isArray(body.notes.items))
    await tap.ok(body.sources)
    await tap.type(body.sources.totalItems, 'number')
    await tap.equal(body.sources.totalItems, 0)
    await tap.ok(Array.isArray(body.sources.items))
    await tap.ok(body.notebooks)
    await tap.type(body.notebooks.totalItems, 'number')
    await tap.equal(body.notebooks.totalItems, 0)
    await tap.ok(Array.isArray(body.notebooks.items))
  })

  const source1 = await createSource(app, token, { name: 'target is here' })
  const note1 = await createNote(app, token, {
    body: { motivation: 'highlighting', content: 'target is in content' }
  })
  const notebook1 = await createNotebook(app, token, {
    name: 'target notebook'
  })

  await tap.test('Search collections with things', async () => {
    const res = await request(app)
      .post('/search')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          search: 'target',
          includeNotes: true,
          includeSources: true,
          includeNotebooks: true
        })
      )

    await tap.equal(res.status, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.ok(body.notes)
    await tap.type(body.notes.totalItems, 'number')
    await tap.equal(body.notes.totalItems, 1)
    await tap.ok(Array.isArray(body.notes.items))
    await tap.equal(body.notes.items.length, 1)
    await tap.equal(body.notes.items[0].shortId, note1.shortId)

    await tap.ok(body.sources)
    await tap.type(body.sources.totalItems, 'number')
    await tap.equal(body.sources.totalItems, 1)
    await tap.ok(Array.isArray(body.sources.items))
    await tap.equal(body.sources.items.length, 1)
    await tap.equal(body.sources.items[0].shortId, source1.shortId)

    await tap.ok(body.notebooks)
    await tap.type(body.notebooks.totalItems, 'number')
    await tap.equal(body.notebooks.totalItems, 1)
    await tap.ok(Array.isArray(body.notebooks.items))
    await tap.equal(body.notebooks.items.length, 1)
    await tap.equal(body.notebooks.items[0].shortId, notebook1.shortId)
  })

  await tap.test('Search only selected collections', async () => {
    const res = await request(app)
      .post('/search')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          search: 'target',
          includeNotes: true,
          includeSources: false,
          includeNotebooks: true
        })
      )

    await tap.equal(res.status, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.ok(body.notes)
    await tap.type(body.notes.totalItems, 'number')
    await tap.equal(body.notes.totalItems, 1)
    await tap.ok(Array.isArray(body.notes.items))
    await tap.equal(body.notes.items.length, 1)
    await tap.equal(body.notes.items[0].shortId, note1.shortId)

    await tap.notOk(body.sources)

    await tap.ok(body.notebooks)
    await tap.type(body.notebooks.totalItems, 'number')
    await tap.equal(body.notebooks.totalItems, 1)
    await tap.ok(Array.isArray(body.notebooks.items))
    await tap.equal(body.notebooks.items.length, 1)
    await tap.equal(body.notebooks.items[0].shortId, notebook1.shortId)
  })

  await destroyDB(app)
}

module.exports = test
