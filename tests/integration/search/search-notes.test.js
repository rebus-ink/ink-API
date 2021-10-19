const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNote
} = require('../../utils/testUtils')
const app = require('../../../server').app

const test = async () => {
  const token = getToken()
  await createUser(app, token)

  const note0 = await createNote(app, token, {
    body: { motivation: 'highlighting', content: 'nothing to see here' }
  })
  const note1 = await createNote(app, token, {
    body: { motivation: 'highlighting', content: 'target is in content' }
  })
  const note2 = await createNote(app, token, {
    body: { motivation: 'commenting', content: 'taRGet in content' }
  })

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
    await tap.equal(body.notes.totalItems, 2)
    await tap.ok(Array.isArray(body.notes.items))
    await tap.equal(body.notes.items.length, 2)
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
    await tap.equal(body.notes.totalItems, 1)
    await tap.ok(Array.isArray(body.notes.items))
    await tap.equal(body.notes.items.length, 1)
    await tap.equal(body.notes.items[0].shortId, note2.shortId)
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
    await tap.equal(body.notes.totalItems, 12)
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
    await tap.equal(body.notes.totalItems, 12)
    await tap.ok(Array.isArray(body.notes.items))
    await tap.equal(body.notes.items.length, 2)
  })

  await destroyDB(app)
}

module.exports = test
