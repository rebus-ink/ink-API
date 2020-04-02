const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createTag,
  addPubToCollection
} = require('../../utils/testUtils')
const app = require('../../../server').app
const { urlToId } = require('../../../utils/utils')

const test = async () => {
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerUrl = urlparse(readerCompleteUrl).path
  const readerId = urlToId(readerCompleteUrl)

  let time

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

  await tap.test('Get Library containing a publication', async () => {
    await createPublication(app, token, {
      type: 'Book',
      name: 'Publication A',
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
    const pub = body.items[0]
    await tap.equal(pub.type, 'Book')
    await tap.type(pub.id, 'string')
    await tap.type(pub.name, 'string')
    await tap.equal(pub.name, 'Publication A')
    await tap.equal(pub.author[0].name, 'John Smith')
    await tap.equal(pub.editor[0].name, 'Jane Doe')
    await tap.ok(pub.links)
    // await tap.equal(pub.contributor[0].name, 'Sample Contributor')
    // await tap.equal(pub.creator[0].name, 'Sample Creator')
    // await tap.equal(pub.illustrator[0].name, 'Sample Illustrator')
    // await tap.equal(pub.publisher[0].name, 'Sample Publisher')
    // await tap.equal(pub.translator[0].name, 'Sample Translator')
    // await tap.equal(pub.keywords[0], 'one')
    // await tap.ok(pub.json)
    await tap.ok(pub.resources)
    await tap.equal(pub.encodingFormat, 'epub')
    await tap.equal(pub.bookFormat, 'EBook')
    // // documents should NOT include:
    await tap.notOk(pub.readingOrder)
    await tap.notOk(pub.contributor)
    await tap.notOk(pub.creator)
    await tap.notOk(pub.illustrator)
    await tap.notOk(pub.publisher)
    await tap.notOk(pub.translator)
    await tap.notOk(pub.keywords)
    await tap.notOk(pub.json)
    await tap.notOk(pub.abstract)
    await tap.notOk(pub.numberOfPages)
    await tap.notOk(pub.url)
    await tap.notOk(pub.dateModified)
    await tap.notOk(pub.bookEdition)
    await tap.notOk(pub.isbn)
    await tap.notOk(pub.copyrightYear)
    await tap.notOk(pub.genre)
    await tap.notOk(pub.license)
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

    let collectionId

    await tap.test(
      'Get Library with if-modified-since header - after collection created',
      async () => {
        await createTag(app, token)

        const res = await request(app)
          .get('/library')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.type, 'Collection')
        time = new Date().getTime()
        collectionId = body.tags[0].id
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after collection updated',
      async () => {
        await request(app)
          .post(`${readerUrl}/activity`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
          .send(
            JSON.stringify({
              type: 'Update',
              object: {
                id: collectionId,
                name: 'new collection name'
              }
            })
          )

        const res = await request(app)
          .get('/library')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.type, 'Collection')
        time = new Date().getTime()
      }
    )

    let publication

    await tap.test(
      'Get Library with if-modified-since header - after publication created',
      async () => {
        publication = await createPublication(app, token)

        const res = await request(app)
          .get('/library')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.type, 'Collection')

        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after publication updated',
      async () => {
        await request(app)
          .post(`${readerUrl}/activity`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
          .send(
            JSON.stringify({
              type: 'Update',
              object: {
                type: 'Publication',
                id: publication.id,
                abstract: 'new description!'
              }
            })
          )

        const res = await request(app)
          .get('/library')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.type, 'Collection')
        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after publication added to collection',
      async () => {
        await addPubToCollection(
          app,
          token,
          readerId,
          publication.id,
          collectionId
        )

        const res = await request(app)
          .get('/library')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.type, 'Collection')

        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after publication removed from collection',
      async () => {
        await request(app)
          .delete(
            `/readers/${readerId}/publications/${urlToId(
              publication.id
            )}/tags/${urlToId(collectionId)}`
          )
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')

        const res = await request(app)
          .get('/library')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.type, 'Collection')

        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after publication deleted',
      async () => {
        await request(app)
          .post(`${readerUrl}/activity`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
          .send(
            JSON.stringify({
              type: 'Delete',
              object: {
                type: 'Publication',
                id: publication.id
              }
            })
          )

        const res = await request(app)
          .get('/library')
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type('application/ld+json')
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.type, 'Collection')

        time = new Date().getTime()
      }
    )

    await tap.test(
      'Get Library with if-modified-since header - after collection deleted',
      async () => {
        await request(app)
          .post(`${readerUrl}/activity`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type('application/ld+json')
          .send(
            JSON.stringify({
              type: 'Delete',
              object: {
                type: 'reader:Tag',
                id: collectionId
              }
            })
          )

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
