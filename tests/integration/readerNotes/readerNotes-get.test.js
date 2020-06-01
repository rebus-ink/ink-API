const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createNote,
  createNoteContext,
  addNoteToContext,
  addNoteToCollection,
  createTag
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')
const _ = require('lodash')

const test = async app => {
  const token = getToken()
  const readerId = await createUser(app, token)

  const source = await createSource(app, token, {
    name: 'Source A'
  })
  const sourceUrl = source.id
  const sourceId = urlToId(source.id)

  const createNoteSimplified = async object => {
    const noteObj = Object.assign(
      { sourceId, body: { motivation: 'test' } },
      object
    )
    return await createNote(app, token, noteObj)
  }

  await tap.test('Get empty list of notes', async () => {
    const res = await request(app)
      .get('/notes')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.status, 200)
    const body = res.body
    await tap.equal(body.totalItems, 0)
    await tap.equal(body.items.length, 0)
  })

  await tap.test('Get all notes for a Reader', async () => {
    // create more notes
    await createNoteSimplified({
      body: { content: 'first', motivation: 'test' }
    })
    await createNoteSimplified({
      body: { content: 'second', motivation: 'test' }
    })
    const note3 = await createNoteSimplified({
      body: { content: 'third', motivation: 'test' }
    })

    const tag = await createTag(app, token, { name: 'test' })
    await addNoteToCollection(app, token, note3.shortId, tag.id)

    const res = await request(app)
      .get('/notes')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.equal(body.totalItems, 3)
    await tap.equal(body.items.length, 3)
    const firstItem = body.items[0]
    await tap.ok(firstItem.body)
    await tap.ok(firstItem.body[0].content)
    await tap.equal(firstItem.body[0].motivation, 'test')
    await tap.ok(firstItem.sourceId)
    // notes should include source information
    await tap.ok(firstItem.source)
    await tap.type(firstItem.source.name, 'string')
    await tap.ok(firstItem.source.author)
    await tap.type(firstItem.source.author[0].name, 'string')
    // should include tags
    await tap.ok(firstItem.tags)
    await tap.equal(firstItem.tags.length, 1)
  })

  await tap.test('Should also include notes without a sourceId', async () => {
    await createNote(app, token, {
      body: { motivation: 'test' }
    })

    const res = await request(app)
      .get('/notes')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.equal(body.totalItems, 4)
    await tap.equal(body.items.length, 4)
  })

  await tap.test('Should not include notes that have a contextId', async () => {
    const context = await createNoteContext(app, token)
    await addNoteToContext(app, token, context.shortId, {
      body: { motivation: 'test', content: 'context note' }
    })

    const res = await request(app)
      .get('/notes')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    const body = res.body
    await tap.equal(body.totalItems, 4)
    await tap.equal(body.items.length, 4)
    const index = _.findIndex(body.items, item => {
      return item.body[0].content === 'context note'
    })
    await tap.equal(index, -1)
  })

  await destroyDB(app)
}

module.exports = test
