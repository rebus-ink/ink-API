const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
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

  await tap.test('Get empty library', async () => {
    const res = await request(app)
      .get('/library')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.status, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 0)
    await tap.ok(Array.isArray(body.items))
  })

  await tap.test('Get Library containing a source', async () => {
    const source1 = await createSource(app, token, {
      type: 'Book',
      name: 'Source A',
      author: ['John Smith'],
      editor: 'Jane Doe',
      contributor: ['Sample Contributor'],
      creator: ['Sample Creator'],
      illustrator: ['Sample Illustrator'],
      publisher: ['Sample Publisher'],
      translator: ['Sample Translator'],
      abstract: 'this is a description!!',
      numberOfPages: 99,
      encodingFormat: 'epub',
      keywords: ['one', 'two'],
      url: 'http://www.something.com',
      dateModified: new Date(2020, 11, 11).toISOString(),
      bookEdition: 'third',
      bookFormat: 'EBook',
      isbn: '1234',
      copyrightYear: 1977,
      genre: 'vampire romance',
      license: 'http://www.mylicense.com',
      links: [{ url: 'value' }],
      readingOrder: [{ url: 'one' }, { url: 'two' }, { url: 'three' }],
      resources: [{ url: 'value' }],
      json: { property: 'value' }
    })

    const activity1 = await request(app)
      .post(`/sources/${source1.shortId}/readActivity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          selector: {
            type: 'XPathSelector',
            value: '/html/body/p[2]/table/tr[2]/td[3]/span',
            property: 'last'
          }
        })
      )

    await tap.equal(activity1.statusCode, 201)

    const activity2 = await request(app)
      .post(`/sources/${source1.shortId}/readActivity`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
      .send(
        JSON.stringify({
          selector: {
            type: 'XPathSelector',
            value: '/html/body/p[2]/table/tr[2]/td[3]/span',
            property: 'last'
          }
        })
      )
    await tap.equal(activity2.statusCode, 201)
    const activityId2 = activity2.body.id

    const res = await request(app)
      .get('/library')
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 1)
    await tap.equal(body.page, 1)
    await tap.equal(body.pageSize, 10)
    await tap.ok(Array.isArray(body.items))
    // documents should include:
    const source = body.items[0]
    await tap.equal(source.type, 'Book')
    await tap.type(source.id, 'string')
    await tap.type(source.name, 'string')
    await tap.equal(source.name, 'Source A')
    await tap.equal(source.author[0].name, 'John Smith')
    await tap.equal(source.editor[0].name, 'Jane Doe')
    await tap.ok(source.links)
    // await tap.equal(source.contributor[0].name, 'Sample Contributor')
    // await tap.equal(source.creator[0].name, 'Sample Creator')
    // await tap.equal(source.illustrator[0].name, 'Sample Illustrator')
    // await tap.equal(source.sourcelisher[0].name, 'Sample Sourcelisher')
    // await tap.equal(source.translator[0].name, 'Sample Translator')
    // await tap.equal(source.keywords[0], 'one')
    // await tap.ok(source.json)
    await tap.ok(source.resources)
    await tap.equal(source.encodingFormat, 'epub')
    await tap.equal(source.bookFormat, 'EBook')
    await tap.ok(source.lastReadActivity)
    await tap.equal(source.lastReadActivity.id, activityId2)
    // // documents should NOT include:
    await tap.notOk(source.readingOrder)
    await tap.notOk(source.contributor)
    await tap.notOk(source.creator)
    await tap.notOk(source.illustrator)
    await tap.notOk(source.publisher)
    await tap.notOk(source.translator)
    await tap.notOk(source.keywords)
    await tap.notOk(source.json)
    await tap.notOk(source.abstract)
    await tap.notOk(source.numberOfPages)
    await tap.notOk(source.url)
    await tap.notOk(source.dateModified)
    await tap.notOk(source.bookEdition)
    await tap.notOk(source.isbn)
    await tap.notOk(source.copyrightYear)
    await tap.notOk(source.genre)
    await tap.notOk(source.license)
  })

  if (process.env.REDIS_PASSWORD) {
    await tap.test(
      'Get Library with if-modified-since header - not modified',
      async () => {
        time = new Date().getTime()
        // with time at beginning - so it will be modified
        const res = await request(app)
          .get('/library')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 304)
        await tap.notOk(res.body)
      }
    )

    let tag = await createTag(app, token, { type: 'test', name: 'test' })

    await tap.test(
      'Get Library with if-modified-since header - after tag created',
      async () => {
        const res = await request(app)
          .get('/library')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.items.length, 1)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after tag updated',
      async () => {
        const updateRes = await request(app)
          .put(`/tags/${tag.id}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
          .send(
            JSON.stringify({
              name: 'new name',
              type: 'test',
              id: tag.id,
              readerId: tag.readerId
            })
          )
        await tap.equal(updateRes.statusCode, 200)

        const res = await request(app)
          .get('/library')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.items.length, 1)
        time = new Date().getTime()
      }
    )

    let source = await createSource(app, token)

    await tap.test(
      'Get Library with if-modified-since header - after source created',
      async () => {
        const res = await request(app)
          .get('/library')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.items.length, 2)

        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after source updated',
      async () => {
        const updateRes = await request(app)
          .patch(`/sources/${source.shortId}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
          .send(
            JSON.stringify({
              abstract: 'new abstract!!'
            })
          )
        await tap.equal(updateRes.statusCode, 200)

        const res = await request(app)
          .get('/library')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.items.length, 2)
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after source added to collection',
      async () => {
        await addSourceToCollection(app, token, source.shortId, tag.id)

        const res = await request(app)
          .get('/library')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.items.length, 2)

        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after source removed from collection',
      async () => {
        const deleteRes = await request(app)
          .delete(`/sources/${source.shortId}/tags/${tag.id}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
        await tap.equal(deleteRes.statusCode, 204)

        const res = await request(app)
          .get('/library')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.items.length, 2)

        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after source deleted',
      async () => {
        const deleteRes = await request(app)
          .delete(`/sources/${source.shortId}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
        await tap.equal(deleteRes.statusCode, 204)

        const res = await request(app)
          .get('/library')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.items.length, 1)

        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after tag deleted',
      async () => {
        const deleteRes = await request(app)
          .delete(`/tags/${tag.id}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
        await tap.equal(deleteRes.statusCode, 204)

        const res = await request(app)
          .get('/library')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')

        time = new Date().getTime()
      }
    )

    const notebook = await createNotebook(app, token, { name: 'notebook' })

    await tap.test(
      'Get Library with if-modified-since header - after source added to notebook',
      async () => {
        await addSourceToNotebook(app, token, source.shortId, notebook.shortId)

        const res = await request(app)
          .get('/library')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')

        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after source removed from notebook',
      async () => {
        const deleteRes = await request(app)
          .delete(`/notebooks/${notebook.shortId}/sources/${source.shortId}`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
        await tap.equal(deleteRes.statusCode, 204)

        const res = await request(app)
          .get('/library')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')

        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after creating source in notebook',
      async () => {
        const createRes = await request(app)
          .post(`/notebooks/${notebook.shortId}/sources`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
          .send(JSON.stringify({ name: 'source1', type: 'Book' }))
        await tap.equal(createRes.statusCode, 201)

        const res = await request(app)
          .get('/library')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')

        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after creating readActivity',
      async () => {
        await createReadActivity(app, token, source.shortId)

        const res = await request(app)
          .get('/library')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')

        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after batch update',
      async () => {
        const updateRes = await request(app)
          .patch(`/sources/batchUpdate`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
          .send(
            JSON.stringify({
              sources: [source.shortId],
              operation: 'replace',
              property: 'type',
              value: 'Article'
            })
          )
        await tap.equal(updateRes.statusCode, 204)

        const res = await request(app)
          .get('/library')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')

        time = new Date().getTime()
      }
    )
  }

  await destroyDB(app)
}

module.exports = test
