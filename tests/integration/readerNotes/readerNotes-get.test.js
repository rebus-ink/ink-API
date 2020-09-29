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
  createTag,
  createNotebook
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')
const _ = require('lodash')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const source = await createSource(app, token, {
    name: 'Source A'
  })
  const sourceId = urlToId(source.id)

  const createNoteSimplified = async object => {
    const noteObj = Object.assign(
      { sourceId, body: { motivation: 'test' } },
      object
    )
    return await createNote(app, token, noteObj)
  }
  const tag = await createTag(app, token, { type: 'test', name: 'some tag' })
  const notebook = await createNotebook(app, token, { name: 'notebook1' })

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

    const tag2 = await createTag(app, token, { name: 'test' })
    await addNoteToCollection(app, token, note3.shortId, tag2.id)

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

  await tap.test(
    'Get all notes for a Reader after a source turned to reference',
    async () => {
      const resDelete = await request(app)
        .delete(`/sources/${sourceId}?reference=true`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(resDelete.statusCode, 204)

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
      // notes should still include source information
      await tap.ok(firstItem.source)
      await tap.type(firstItem.source.name, 'string')
      await tap.ok(firstItem.source.author)
      await tap.type(firstItem.source.author[0].name, 'string')
    }
  )

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

  if (process.env.REDIS_PASSWORD) {
    await tap.test(
      'Get Notes with if-modified-since header - not modified',
      async () => {
        time = new Date().getTime()
        // with time at beginning - so it will be modified
        const res = await request(app)
          .get('/notes')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 304)
        await tap.notOk(res.body)
      }
    )

    // create, update, delete note
    const newNote = await createNote(app, token)
    const newNote2 = await createNote(app, token)
    await tap.test(
      'Get Library with if-modified-since header - after note created',
      async () => {
        const res = await request(app)
          .get('/notes')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.items.length, 6)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after note updated',
      async () => {
        const updateRes = await request(app)
          .put(`/notes/${newNote.shortId}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
          .send(
            JSON.stringify(
              Object.assign(newNote, {
                body: { motivation: 'test', content: 'new content' }
              })
            )
          )

        await tap.equal(updateRes.statusCode, 200)

        const res = await request(app)
          .get('/notes')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.items.length, 6)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after note assigned to tag',
      async () => {
        await addNoteToCollection(app, token, newNote.shortId, tag.id)

        const res = await request(app)
          .get('/notes')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.items.length, 6)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after note removed from tag',
      async () => {
        const updateRes = await request(app)
          .delete(`/notes/${newNote.shortId}/tags/${tag.id}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
        await tap.equal(updateRes.statusCode, 204)

        const res = await request(app)
          .get('/notes')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.items.length, 6)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after note added to notebook',
      async () => {
        const updateRes = await request(app)
          .put(`/notebooks/${notebook.shortId}/notes/${newNote.shortId}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')

        await tap.equal(updateRes.statusCode, 204)

        const res = await request(app)
          .get('/notes')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.items.length, 6)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after note created in notebook',
      async () => {
        const updateRes = await request(app)
          .post(`/notebooks/${notebook.shortId}/notes`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
          .send(
            JSON.stringify({
              body: { motivation: 'highlighting', content: 'abc' }
            })
          )

        await tap.equal(updateRes.statusCode, 201)

        const res = await request(app)
          .get('/notes')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.items.length, 7)
        time = new Date().getTime()
      }
    )

    let noteRelation
    await tap.test(
      'Get Library with if-modified-since header - after noteRelation is created',
      async () => {
        const createRes = await request(app)
          .post(`/noteRelations`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
          .send(
            JSON.stringify({
              from: newNote2.shortId,
              to: newNote.shortId,
              type: 'test',
              json: { property: 'value' }
            })
          )

        await tap.equal(createRes.statusCode, 201)
        noteRelation = createRes.body

        const res = await request(app)
          .get('/notes')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.items.length, 7)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after noteRelation is updated',
      async () => {
        const updateRes = await request(app)
          .put(`/noteRelations/${noteRelation.id}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
          .send(
            JSON.stringify({
              from: newNote2.shortId,
              to: newNote.shortId,
              type: 'test',
              json: { property: 'value2' }
            })
          )

        await tap.equal(updateRes.statusCode, 200)

        const res = await request(app)
          .get('/notes')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.items.length, 7)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after noteRelation is deleted',
      async () => {
        const updateRes = await request(app)
          .delete(`/noteRelations/${noteRelation.id}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
          .send(
            JSON.stringify({
              from: newNote2.shortId,
              to: newNote.shortId,
              type: 'test',
              json: { property: 'value2' }
            })
          )

        await tap.equal(updateRes.statusCode, 204)

        const res = await request(app)
          .get('/notes')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.items.length, 7)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after note removed from notebook',
      async () => {
        const updateRes = await request(app)
          .delete(`/notebooks/${notebook.shortId}/notes/${newNote.shortId}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')

        await tap.equal(updateRes.statusCode, 204)

        const res = await request(app)
          .get('/notes')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.items.length, 7)
        time = new Date().getTime()
      }
    )
  }

  await destroyDB(app)
}

module.exports = test
