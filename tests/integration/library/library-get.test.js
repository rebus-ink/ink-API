const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource
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

  // if (process.env.REDIS_PASSWORD) {
  //   await tap.test(
  //     'Get Library with if-modified-since header - not modified',
  //     async () => {
  //       time = new Date().getTime()
  //       // with time at beginning - so it will be modified
  //       const res = await request(app)
  //         .get('/library')
  //         .set('Host', 'reader-api.test')
  //         .set('Authorization', `Bearer ${token}`)
  //         .set('If-Modified-Since', time)
  //         .type('application/ld+json')
  //       await tap.equal(res.statusCode, 304)
  //       await tap.notOk(res.body)
  //     }
  //   )

  //   let collectionId

  //   await tap.test(
  //     'Get Library with if-modified-since header - after collection created',
  //     async () => {
  //       await createTag(app, token)

  //       const res = await request(app)
  //         .get('/library')
  //         .set('Host', 'reader-api.test')
  //         .set('Authorization', `Bearer ${token}`)
  //         .set('If-Modified-Since', time)
  //         .type('application/ld+json')
  //       await tap.equal(res.statusCode, 200)

  //       const body = res.body
  //       await tap.type(body, 'object')
  //       await tap.equal(body.type, 'Collection')
  //       time = new Date().getTime()
  //       collectionId = body.tags[0].id
  //     }
  //   )

  //   await tap.test(
  //     'Get Library with if-modified-since header - after collection updated',
  //     async () => {
  //       await request(app)
  //         .post(`${readerUrl}/activity`)
  //         .set('Host', 'reader-api.test')
  //         .set('Authorization', `Bearer ${token}`)
  //         .type('application/ld+json')
  //         .send(
  //           JSON.stringify({
  //             type: 'Update',
  //             object: {
  //               id: collectionId,
  //               name: 'new collection name'
  //             }
  //           })
  //         )

  //       const res = await request(app)
  //         .get('/library')
  //         .set('Host', 'reader-api.test')
  //         .set('Authorization', `Bearer ${token}`)
  //         .set('If-Modified-Since', time)
  //         .type('application/ld+json')
  //       await tap.equal(res.statusCode, 200)

  //       const body = res.body
  //       await tap.type(body, 'object')
  //       await tap.equal(body.type, 'Collection')
  //       time = new Date().getTime()
  //     }
  //   )

  //   let source

  //   await tap.test(
  //     'Get Library with if-modified-since header - after source created',
  //     async () => {
  //       source = await createSource(app, token)

  //       const res = await request(app)
  //         .get('/library')
  //         .set('Host', 'reader-api.test')
  //         .set('Authorization', `Bearer ${token}`)
  //         .set('If-Modified-Since', time)
  //         .type('application/ld+json')
  //       await tap.equal(res.statusCode, 200)

  //       const body = res.body
  //       await tap.type(body, 'object')
  //       await tap.equal(body.type, 'Collection')

  //       time = new Date().getTime()
  //     }
  //   )

  //   await tap.test(
  //     'Get Library with if-modified-since header - after source updated',
  //     async () => {
  //       await request(app)
  //         .post(`${readerUrl}/activity`)
  //         .set('Host', 'reader-api.test')
  //         .set('Authorization', `Bearer ${token}`)
  //         .type('application/ld+json')
  //         .send(
  //           JSON.stringify({
  //             type: 'Update',
  //             object: {
  //               type: 'Source',
  //               id: source.id,
  //               abstract: 'new description!'
  //             }
  //           })
  //         )

  //       const res = await request(app)
  //         .get('/library')
  //         .set('Host', 'reader-api.test')
  //         .set('Authorization', `Bearer ${token}`)
  //         .set('If-Modified-Since', time)
  //         .type('application/ld+json')
  //       await tap.equal(res.statusCode, 200)

  //       const body = res.body
  //       await tap.type(body, 'object')
  //       await tap.equal(body.type, 'Collection')
  //       time = new Date().getTime()
  //     }
  //   )

  //   await tap.test(
  //     'Get Library with if-modified-since header - after source added to collection',
  //     async () => {
  //       await addSourceToCollection(
  //         app,
  //         token,
  //         readerId,
  //         source.id,
  //         collectionId
  //       )

  //       const res = await request(app)
  //         .get('/library')
  //         .set('Host', 'reader-api.test')
  //         .set('Authorization', `Bearer ${token}`)
  //         .set('If-Modified-Since', time)
  //         .type('application/ld+json')
  //       await tap.equal(res.statusCode, 200)

  //       const body = res.body
  //       await tap.type(body, 'object')
  //       await tap.equal(body.type, 'Collection')

  //       time = new Date().getTime()
  //     }
  //   )

  //   await tap.test(
  //     'Get Library with if-modified-since header - after source removed from collection',
  //     async () => {
  //       await request(app)
  //         .delete(
  //           `/readers/${readerId}/sources/${urlToId(
  //             source.id
  //           )}/tags/${urlToId(collectionId)}`
  //         )
  //         .set('Host', 'reader-api.test')
  //         .set('Authorization', `Bearer ${token}`)
  //         .type('application/ld+json')

  //       const res = await request(app)
  //         .get('/library')
  //         .set('Host', 'reader-api.test')
  //         .set('Authorization', `Bearer ${token}`)
  //         .set('If-Modified-Since', time)
  //         .type('application/ld+json')
  //       await tap.equal(res.statusCode, 200)

  //       const body = res.body
  //       await tap.type(body, 'object')
  //       await tap.equal(body.type, 'Collection')

  //       time = new Date().getTime()
  //     }
  //   )

  //   await tap.test(
  //     'Get Library with if-modified-since header - after source deleted',
  //     async () => {
  //       await request(app)
  //         .post(`${readerUrl}/activity`)
  //         .set('Host', 'reader-api.test')
  //         .set('Authorization', `Bearer ${token}`)
  //         .type('application/ld+json')
  //         .send(
  //           JSON.stringify({
  //             type: 'Delete',
  //             object: {
  //               type: 'Source',
  //               id: source.id
  //             }
  //           })
  //         )

  //       const res = await request(app)
  //         .get('/library')
  //         .set('Host', 'reader-api.test')
  //         .set('Authorization', `Bearer ${token}`)
  //         .set('If-Modified-Since', time)
  //         .type('application/ld+json')
  //       await tap.equal(res.statusCode, 200)

  //       const body = res.body
  //       await tap.type(body, 'object')
  //       await tap.equal(body.type, 'Collection')

  //       time = new Date().getTime()
  //     }
  //   )

  //   await tap.test(
  //     'Get Library with if-modified-since header - after collection deleted',
  //     async () => {
  //       await request(app)
  //         .post(`${readerUrl}/activity`)
  //         .set('Host', 'reader-api.test')
  //         .set('Authorization', `Bearer ${token}`)
  //         .type('application/ld+json')
  //         .send(
  //           JSON.stringify({
  //             type: 'Delete',
  //             object: {
  //               type: 'reader:Tag',
  //               id: collectionId
  //             }
  //           })
  //         )

  //       const res = await request(app)
  //         .get('/library')
  //         .set('Host', 'reader-api.test')
  //         .set('Authorization', `Bearer ${token}`)
  //         .set('If-Modified-Since', time)
  //         .type('application/ld+json')
  //       await tap.equal(res.statusCode, 200)

  //       const body = res.body
  //       await tap.type(body, 'object')

  //       time = new Date().getTime()
  //     }
  //   )
  // }

  await destroyDB(app)
}

module.exports = test
