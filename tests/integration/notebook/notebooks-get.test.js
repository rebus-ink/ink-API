const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNotebook,
  createSource,
  createNote,
  createTag
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  await tap.test('Get Notebooks for a reader with no notebooks', async () => {
    const res = await request(app)
      .get('/notebooks')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.equal(res.body.items.length, 0)
    await tap.equal(res.body.totalItems, 0)
    await tap.equal(res.body.page, 1)
    await tap.equal(res.body.pageSize, 10)
  })

  await createNotebook(app, token, {
    name: 'outline1',
    description: 'description1',
    settings: {
      property: 'value'
    }
  })
  await createNotebook(app, token, {
    name: 'outline2',
    description: 'description2',
    settings: {
      property: 'value'
    }
  })

  await tap.test('Get Notebooks', async () => {
    const res = await request(app)
      .get('/notebooks')
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
    await tap.ok(body.settings)
    await tap.equal(body.status, 'active')
    await tap.ok(body.published)
    await tap.ok(body.updated)
    await tap.equal(body.tags.length, 0)
  })

  if (process.env.REDIS_PASSWORD) {
    await tap.test(
      'Get Notebooks with if-modified-since header - not modified',
      async () => {
        time = new Date().getTime()
        // with time at beginning - so it will be modified
        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 304)
      }
    )

    let newNotebook = await createNotebook(app, token, { name: 'new notebook' })
    let newNotebook2 = await createNotebook(app, token, { name: 'notebook2' })
    // Create, update and delete Notebook
    await tap.test(
      'Get Notebooks with if-modified-since header - after notebook created',
      async () => {
        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.equal(body.items.length, 4)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Notebooks with if-modified-since header - after notebook update',
      async () => {
        const resUpdate = await request(app)
          .put(`/notebooks/${newNotebook.shortId}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
          .send(
            JSON.stringify(Object.assign(newNotebook, { name: 'new name' }))
          )

        await tap.equal(resUpdate.statusCode, 200)

        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.equal(body.items.length, 4)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Notebooks with if-modified-since header - after notebook deleted',
      async () => {
        const resDelete = await request(app)
          .delete(`/notebooks/${newNotebook2.shortId}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')

        await tap.equal(resDelete.statusCode, 204)

        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.equal(body.items.length, 3)
        time = new Date().getTime()
      }
    )

    // Create, update, delete Source
    const source = await createSource(app, token, {
      name: 'something',
      type: 'Book'
    })
    await tap.test(
      'Get Notebooks with if-modified-since header - after source created',
      async () => {
        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.equal(body.items.length, 3)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Notebooks with if-modified-since header - after source updated',
      async () => {
        const resUpdate = await request(app)
          .patch(`/sources/${source.shortId}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
          .send(JSON.stringify(Object.assign(source, { name: 'new name' })))

        await tap.equal(resUpdate.statusCode, 200)

        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.equal(body.items.length, 3)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Notebooks with if-modified-since header - after source deleted',
      async () => {
        const resDelete = await request(app)
          .delete(`/sources/${source.shortId}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')

        await tap.equal(resDelete.statusCode, 204)

        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.equal(body.items.length, 3)
        time = new Date().getTime()
      }
    )
    // Create, update, delete Note
    const note = await createNote(app, token, { body: { motivation: 'test' } })
    await tap.test(
      'Get Notebooks with if-modified-since header - after note created',
      async () => {
        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.equal(body.items.length, 3)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Notebooks with if-modified-since header - after note updated',
      async () => {
        const resUpdate = await request(app)
          .put(`/notes/${note.shortId}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
          .send(
            JSON.stringify(
              Object.assign(note, {
                body: { motivation: 'test', content: 'new content' }
              })
            )
          )

        await tap.equal(resUpdate.statusCode, 200)

        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.equal(body.items.length, 3)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Notebooks with if-modified-since header - after note deleted',
      async () => {
        const resDelete = await request(app)
          .delete(`/notes/${note.shortId}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')

        await tap.equal(resDelete.statusCode, 204)

        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.equal(body.items.length, 3)
        time = new Date().getTime()
      }
    )
    // Create, update, delete Tag
    const tag = await createTag(app, token, { name: 'something', type: 'tag' })
    await tap.test(
      'Get Notebooks with if-modified-since header - after tag created',
      async () => {
        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.equal(body.items.length, 3)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Notebooks with if-modified-since header - after tag updated',
      async () => {
        const resUpdate = await request(app)
          .put(`/tags/${tag.id}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
          .send(JSON.stringify(Object.assign(tag, { name: 'new name' })))

        await tap.equal(resUpdate.statusCode, 200)

        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.equal(body.items.length, 3)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Notebooks with if-modified-since header - after tag deleted',
      async () => {
        const resDelete = await request(app)
          .delete(`/tags/${tag.id}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')

        await tap.equal(resDelete.statusCode, 204)

        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.equal(body.items.length, 3)
        time = new Date().getTime()
      }
    )

    // Add / remove source-tag

    const source2 = await createSource(app, token, {
      name: 'source2',
      type: 'Book'
    })
    const tag2 = await createTag(app, token, {
      name: 'new tag',
      type: 'something'
    })
    time = new Date().getTime()

    await tap.test(
      'Get Notebooks with if-modified-since header - after source added to tag',
      async () => {
        const resAdd = await request(app)
          .put(`/sources/${source2.shortId}/tags/${tag2.id}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')

        await tap.equal(resAdd.statusCode, 204)

        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.equal(body.items.length, 3)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Notebooks with if-modified-since header - after source removed from tag',
      async () => {
        const resDelete = await request(app)
          .delete(`/sources/${source2.shortId}/tags/${tag2.id}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')

        await tap.equal(resDelete.statusCode, 204)

        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.equal(body.items.length, 3)
        time = new Date().getTime()
      }
    )
    // Add / remove note-tag
    const note2 = await createNote(app, token, {
      body: { content: 'something', motivation: 'test' }
    })
    time = new Date().getTime()

    await tap.test(
      'Get Notebooks with if-modified-since header - after note added to tag',
      async () => {
        const resAdd = await request(app)
          .put(`/notes/${note2.shortId}/tags/${tag2.id}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')

        await tap.equal(resAdd.statusCode, 204)

        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.equal(body.items.length, 3)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Notebooks with if-modified-since header - after note removed from tag',
      async () => {
        const resDelete = await request(app)
          .delete(`/notes/${note2.shortId}/tags/${tag2.id}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')

        await tap.equal(resDelete.statusCode, 204)

        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.equal(body.items.length, 3)
        time = new Date().getTime()
      }
    )

    // Add / remove notebook-tag
    const newNotebook3 = await createNotebook(app, token, {
      name: 'newNotebook'
    })
    time = new Date().getTime()

    await tap.test(
      'Get Notebooks with if-modified-since header - after notebook added to tag',
      async () => {
        const resAdd = await request(app)
          .put(`/notebooks/${newNotebook3.shortId}/tags/${tag2.id}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')

        await tap.equal(resAdd.statusCode, 204)

        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.equal(body.items.length, 4)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Notebooks with if-modified-since header - after notebook removed from tag',
      async () => {
        const resDelete = await request(app)
          .delete(`/notebooks/${newNotebook3.shortId}/tags/${tag2.id}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')

        await tap.equal(resDelete.statusCode, 204)

        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.equal(body.items.length, 4)
        time = new Date().getTime()
      }
    )

    // Add / remove source-notebook

    await tap.test(
      'Get Notebooks with if-modified-since header - after source added to notebook',
      async () => {
        const resAdd = await request(app)
          .put(`/notebooks/${newNotebook3.shortId}/sources/${source2.shortId}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')

        await tap.equal(resAdd.statusCode, 204)

        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.equal(body.items.length, 4)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Notebooks with if-modified-since header - after source removed from notebook',
      async () => {
        const resDelete = await request(app)
          .delete(
            `/notebooks/${newNotebook3.shortId}/sources/${source2.shortId}`
          )
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')

        await tap.equal(resDelete.statusCode, 204)

        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.equal(body.items.length, 4)
        time = new Date().getTime()
      }
    )

    // Add / remove note-notebook
    await tap.test(
      'Get Notebooks with if-modified-since header - after note added to notebook',
      async () => {
        const resAdd = await request(app)
          .put(`/notebooks/${newNotebook3.shortId}/notes/${note2.shortId}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
        console.log(resAdd.error)
        await tap.equal(resAdd.statusCode, 204)

        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.equal(body.items.length, 4)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Notebooks with if-modified-since header - after note removed from notebook',
      async () => {
        const resDelete = await request(app)
          .delete(`/notebooks/${newNotebook3.shortId}/notes/${note2.shortId}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')

        await tap.equal(resDelete.statusCode, 204)

        const res = await request(app)
          .get('/notebooks')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.equal(body.items.length, 4)
        time = new Date().getTime()
      }
    )
  }

  await destroyDB(app)
}

module.exports = test
