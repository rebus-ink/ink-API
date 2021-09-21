const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createNote,
  createNoteRelation,
  addNoteToCollection,
  createNotebook,
  addNoteToNotebook,
  createTag
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')
const _ = require('lodash')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const source = await createSource(app, token)
  const sourceUrl = source.id
  const sourceId = source.shortId

  const note = await createNote(app, token, {
    body: { motivation: 'test', content: 'content goes here' },
    target: { property1: 'target information' },
    sourceId,
    document: 'doc123',
    json: { pages: '1-2' }
  })
  const noteId = urlToId(note.id)

  const note2 = await createNote(app, token)
  const note3 = await createNote(app, token)

  await tap.test('Get Note', async () => {
    const res = await request(app)
      .get(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.equal(body.shortId, urlToId(body.id))
    await tap.equal(body.body[0].motivation, 'test')
    await tap.equal(body.body[0].content, 'content goes here')
    await tap.equal(body.target.property1, 'target information')
    await tap.equal(body.document, 'doc123')
    await tap.ok(body.published)
    await tap.ok(body.updated)
    await tap.ok(body.json)
    await tap.equal(body.json.pages, '1-2')
    // should include source information
    await tap.ok(body.source)
    await tap.equal(body.source.name, 'source name')
    await tap.equal(body.source.type, 'Book')
    await tap.ok(body.source.id)
    await tap.ok(body.source.shortId)
    await tap.ok(body.source.author)
    await tap.ok(body.source.editor)
    await tap.ok(body.source.keywords)
  })

  await tap.test('Get Note from id url', async () => {
    const res = await request(app)
      .get(urlparse(note.id).path)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.equal(body.body[0].motivation, 'test')
    await tap.equal(body.body[0].content, 'content goes here')
    await tap.equal(body.target.property1, 'target information')
    await tap.ok(body.source)
    await tap.ok(body.published)
    await tap.ok(body.updated)
  })

  // create NoteRelations
  await createNoteRelation(app, token, {
    type: 'test',
    from: note2.shortId,
    to: note3.shortId
  })
  await createNoteRelation(app, token, {
    type: 'test',
    from: noteId,
    to: note2.shortId
  })

  await tap.test('Get Note with NoteRelations', async () => {
    const res = await request(app)
      .get(`/notes/${note2.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.ok(body.relations)
    await tap.equal(body.relations.length, 2)
    let index1 = _.findIndex(body.relations, { from: noteId })
    let index2 = _.findIndex(body.relations, { to: note3.shortId })
    await tap.notEqual(index1, -1)
    await tap.ok(body.relations[index1].fromNote)
    await tap.equal(body.relations[index1].fromNote.shortId, noteId)

    await tap.notEqual(index2, -1)
    await tap.ok(body.relations[index2].toNote)
    await tap.equal(body.relations[index2].toNote.shortId, note3.shortId)
    await tap.ok(body.relations[index2].toNote.body)
  })

  // with tags
  const tag = await createTag(app, token)
  await addNoteToCollection(app, token, noteId, tag.id)

  await tap.test('Get Note with Tag', async () => {
    const res = await request(app)
      .get(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.equal(body.tags.length, 1)
  })

  // with notebook
  const notebook = await createNotebook(app, token)
  await addNoteToNotebook(app, token, noteId, notebook.shortId)

  await tap.test('Get Note with Notebook', async () => {
    const res = await request(app)
      .get(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.equal(body.notebooks.length, 1)
  })

  await tap.test('Try to get Note that does not exist', async () => {
    const res = await request(app)
      .get(`/notes/${noteId}123`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 404)
    const error = JSON.parse(res.text)
    await tap.equal(error.statusCode, 404)
    await tap.equal(error.error, 'Not Found')
    await tap.equal(
      error.message,
      `Get Note Error: No Note found with id ${noteId}123`
    )
    await tap.equal(error.details.requestUrl, `/notes/${noteId}123`)
  })

  await tap.test('Get Source with reference to Notes', async () => {
    const res = await request(app)
      .get(`/sources/${urlToId(sourceUrl)}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.ok(Array.isArray(body.replies))
    await tap.equal(body.replies.length, 1)
  })

  await tap.test('Get Note after source turned into reference', async () => {
    const resDelete = await request(app)
      .delete(`/sources/${sourceId}?reference=true`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(resDelete.statusCode, 204)

    const res = await request(app)
      .get(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.ok(body.source)

    // should still include source information
    await tap.ok(body.source)
    await tap.equal(body.source.name, 'source name')
    await tap.equal(body.source.type, 'Book')
    await tap.ok(body.source.id)
    await tap.ok(body.source.shortId)
    await tap.ok(body.source.author)
    await tap.ok(body.source.editor)
    await tap.ok(body.source.keywords)
  })

  await tap.test('Get Note after source is deleted', async () => {
    const resDelete = await request(app)
      .delete(`/sources/${sourceId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(resDelete.statusCode, 204)

    const res = await request(app)
      .get(`/notes/${noteId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    await tap.notOk(body.sourceId)
    await tap.notOk(body.source)
  })

  await destroyDB(app)
}

module.exports = test
