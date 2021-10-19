const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNote,
  createNotebook,
  addNoteToNotebook
} = require('../../utils/testUtils')
const app = require('../../../server').app

const test = async () => {
  const token = getToken()
  await createUser(app, token)

  const note0 = await createNote(app, token, {
    body: { motivation: 'highlighting', content: 'nothing to see here' },
    target: { property: 'note0' }
  })
  const note1 = await createNote(app, token, {
    body: { motivation: 'highlighting', content: 'target is in content' },
    target: { property: 'note1' }
  })
  const note2 = await createNote(app, token, {
    body: { motivation: 'commenting', content: 'taRGet in content' },
    target: { property: 'note2' }
  })

  const note3 = await createNote(app, token, {
    body: { motivation: 'commenting', content: 'taRGet in content' },
    target: { property: 'note3' }
  })

  const notebook1 = await createNotebook(app, token, { name: 'notebook1' })
  await addNoteToNotebook(app, token, note3.shortId, notebook1.shortId)
  await addNoteToNotebook(app, token, note0.shortId, notebook1.shortId)

  await tap.test('Search notes for highlights and comments', async () => {
    const res = await request(app)
      .post('/search')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          search: 'target',
          includeNotes: true,
          notes: {
            highlights: true,
            comments: true
          }
        })
      )

    await tap.equal(res.status, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.ok(body.notes)
    await tap.type(body.notes.totalItems, 'number')
    await tap.equal(body.notes.totalItems, 3)
    await tap.ok(Array.isArray(body.notes.items))
    await tap.equal(body.notes.items.length, 3)
  })

  await tap.test('Search notes for only highlights', async () => {
    const res = await request(app)
      .post('/search')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          search: 'target',
          includeNotes: true,
          notes: {
            highlights: true,
            comments: false
          }
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
  })

  await tap.test('Search notes for only comments', async () => {
    const res = await request(app)
      .post('/search')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          search: 'target',
          includeNotes: true,
          notes: {
            highlights: false,
            comments: true
          }
        })
      )

    await tap.equal(res.status, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.ok(body.notes)
    await tap.type(body.notes.totalItems, 'number')
    await tap.equal(body.notes.totalItems, 2)
    await tap.ok(Array.isArray(body.notes.items))
    await tap.equal(body.notes.items.length, 2)
  })

  await tap.test('Filter notes by notebook', async () => {
    const res = await request(app)
      .post('/search')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          search: 'target',
          includeNotes: true,
          notes: {
            highlights: true,
            comments: true,
            notebook: notebook1.shortId
          }
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
  })

  // pagination

  await createNote(app, token, {
    body: { motivation: 'commenting', content: 'target goes here' }
  })
  await createNote(app, token, {
    body: { motivation: 'commenting', content: 'target goes here' }
  })
  await createNote(app, token, {
    body: { motivation: 'commenting', content: 'target goes here' }
  })
  await createNote(app, token, {
    body: { motivation: 'commenting', content: 'target goes here' }
  })
  await createNote(app, token, {
    body: { motivation: 'commenting', content: 'target goes here' }
  })
  await createNote(app, token, {
    body: { motivation: 'commenting', content: 'target goes here' }
  })
  await createNote(app, token, {
    body: { motivation: 'commenting', content: 'target goes here' }
  })
  await createNote(app, token, {
    body: { motivation: 'commenting', content: 'target goes here' }
  })
  await createNote(app, token, {
    body: { motivation: 'commenting', content: 'target goes here' }
  })
  await createNote(app, token, {
    body: { motivation: 'commenting', content: 'target goes here' }
  })

  await tap.test('Search notes with pagination', async () => {
    const res = await request(app)
      .post('/search')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          search: 'target',
          includeNotes: true,
          notes: {
            limit: 10
          }
        })
      )

    await tap.equal(res.status, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.ok(body.notes)
    await tap.type(body.notes.totalItems, 'number')
    await tap.equal(body.notes.totalItems, 13)
    await tap.ok(Array.isArray(body.notes.items))
    await tap.equal(body.notes.items.length, 10)
  })

  await tap.test('Search notes with pagination, page 2', async () => {
    const res = await request(app)
      .post('/search')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          search: 'target',
          includeNotes: true,
          notes: {
            limit: 10,
            page: 2
          }
        })
      )

    await tap.equal(res.status, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.ok(body.notes)
    await tap.type(body.notes.totalItems, 'number')
    await tap.equal(body.notes.totalItems, 13)
    await tap.ok(Array.isArray(body.notes.items))
    await tap.equal(body.notes.items.length, 3)
  })

  await destroyDB(app)
}

module.exports = test
