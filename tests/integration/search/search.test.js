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
  createReadActivity,
  addNoteToCollection
} = require('../../utils/testUtils')
const app = require('../../../server').app
const { urlToId } = require('../../../utils/utils')

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

  const tag1 = await createTag(app, token)
  const source1 = await createSource(app, token, {
    name: 'target is here'
  })
  const source2 = await createSource(app, token, {
    name: 'not in search results'
  })
  await addSourceToCollection(app, token, source1.shortId, tag1.shortId)
  const note1 = await createNote(app, token, {
    target: { property: 'value' },
    sourceId: source1.shortId,
    body: { motivation: 'highlighting', content: 'target is in content' }
  })
  const note2 = await createNote(app, token, {
    body: { motivation: 'highlighting', content: 'not in search results' }
  })
  await addNoteToCollection(app, token, note1.shortId, tag1.shortId)
  const notebook1 = await createNotebook(app, token, {
    name: 'target notebook'
  })
  const notebook2 = await createNotebook(app, token, {
    name: 'not in search results'
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
    let noteRes = body.notes.items[0]
    await tap.equal(noteRes.shortId, note1.shortId)
    await tap.ok(noteRes.target)
    await tap.equal(urlToId(noteRes.sourceId), source1.shortId)
    await tap.ok(noteRes.source)
    await tap.ok(noteRes.tags.length)

    await tap.ok(body.sources)
    await tap.type(body.sources.totalItems, 'number')
    await tap.equal(body.sources.totalItems, 1)
    await tap.ok(Array.isArray(body.sources.items))
    await tap.equal(body.sources.items.length, 1)
    await tap.equal(body.sources.items[0].shortId, source1.shortId)
    await tap.ok(body.sources.items[0].tags.length)

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
