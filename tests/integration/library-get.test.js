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
} = require('../utils/utils')
const app = require('../../server').app

const test = async () => {
  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerUrl = urlparse(readerCompleteUrl).path

  let time

  await tap.test('Get empty library', async () => {
    const res = await request(app)
      .get(`${readerUrl}/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res.status, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    // should @context be an object or a string?
    await tap.type(body['@context'], 'string')
    await tap.equal(body.type, 'Collection')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 0)
    await tap.ok(Array.isArray(body.items))
  })

  await tap.test('Get Library containing a publication', async () => {
    await createPublication(readerUrl, {
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
      .get(`${readerUrl}/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    // should @context be an object or a string?
    await tap.type(body['@context'], 'string')
    await tap.equal(body.type, 'Collection')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 1)
    await tap.ok(Array.isArray(body.items))
    // documents should include:
    const pub = body.items[0]
    await tap.equal(pub.type, 'Book')
    await tap.type(pub.id, 'string')
    await tap.type(pub.name, 'string')
    await tap.equal(pub.name, 'Publication A')
    await tap.equal(pub.author[0].name, 'John Smith')
    await tap.equal(pub.editor[0].name, 'Jane Doe')
    await tap.equal(pub.contributor[0].name, 'Sample Contributor')
    await tap.equal(pub.creator[0].name, 'Sample Creator')
    await tap.equal(pub.illustrator[0].name, 'Sample Illustrator')
    await tap.equal(pub.publisher[0].name, 'Sample Publisher')
    await tap.equal(pub.translator[0].name, 'Sample Translator')
    await tap.equal(pub.keywords[0], 'one')
    await tap.ok(pub.json)
    await tap.ok(pub.resources)
    await tap.equal(pub.abstract, 'this is a description!!')
    await tap.equal(pub.numberOfPages, 99)
    await tap.equal(pub.encodingFormat, 'epub')
    await tap.equal(pub.url, 'http://www.something.com')
    await tap.ok(pub.dateModified)
    await tap.equal(pub.bookEdition, 'third')
    await tap.equal(pub.bookFormat, 'EBook')
    await tap.equal(pub.isbn, '1234')
    await tap.equal(pub.copyrightYear, 1977)
    await tap.equal(pub.genre, 'vampire romance')
    await tap.equal(pub.license, 'http://www.mylicense.com')
    // documents should NOT include:
    await tap.notOk(pub.readingOrder)
    await tap.notOk(pub.links)
  })

  await tap.test(
    'Try to get Library for Reader that does not exist',
    async () => {
      const res = await request(app)
        .get(`${readerUrl}abc/library`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )
      await tap.equal(res.status, 404)
      const error = JSON.parse(res.text)
      await tap.equal(error.statusCode, 404)
      await tap.equal(error.error, 'Not Found')
      await tap.equal(error.details.type, 'Reader')
      await tap.type(error.details.id, 'string')
      await tap.equal(error.details.activity, 'Get Library')
    }
  )

  if (process.env.REDIS_PASSWORD) {
    await tap.test(
      'Get Library with if-modified-since header - not modified',
      async () => {
        time = new Date().getTime()
        // with time at beginning - so it will be modified
        const res = await request(app)
          .get(`${readerUrl}/library`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type(
            'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
          )
        await tap.equal(res.statusCode, 304)
        await tap.notOk(res.body)
      }
    )

    let collectionId

    await tap.test(
      'Get Library with if-modified-since header - after collection created',
      async () => {
        await createTag(app, token, readerUrl)

        const res = await request(app)
          .get(`${readerUrl}/library`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type(
            'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
          )
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
          .type(
            'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
          )
          .send(
            JSON.stringify({
              '@context': [
                'https://www.w3.org/ns/activitystreams',
                { reader: 'https://rebus.foundation/ns/reader' }
              ],
              type: 'Update',
              object: {
                type: 'reader:Tag',
                id: collectionId,
                name: 'new collection name'
              }
            })
          )

        const res = await request(app)
          .get(`${readerUrl}/library`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type(
            'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
          )
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
        publication = await createPublication(readerUrl)

        const res = await request(app)
          .get(`${readerUrl}/library`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type(
            'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
          )
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
          .type(
            'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
          )
          .send(
            JSON.stringify({
              '@context': [
                'https://www.w3.org/ns/activitystreams',
                { reader: 'https://rebus.foundation/ns/reader' }
              ],
              type: 'Update',
              object: {
                type: 'Publication',
                id: publication.id,
                abstract: 'new description!'
              }
            })
          )

        const res = await request(app)
          .get(`${readerUrl}/library`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type(
            'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
          )
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
          readerUrl,
          publication.id,
          collectionId
        )

        const res = await request(app)
          .get(`${readerUrl}/library`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type(
            'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
          )
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
          .post(`${readerUrl}/activity`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .type(
            'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
          )
          .send(
            JSON.stringify({
              '@context': [
                'https://www.w3.org/ns/activitystreams',
                { reader: 'https://rebus.foundation/ns/reader' }
              ],
              type: 'Remove',
              object: { id: collectionId, type: 'reader:Tag' },
              target: { id: publication.id, type: 'Publication' }
            })
          )

        const res = await request(app)
          .get(`${readerUrl}/library`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type(
            'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
          )
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
          .type(
            'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
          )
          .send(
            JSON.stringify({
              '@context': [
                'https://www.w3.org/ns/activitystreams',
                { reader: 'https://rebus.foundation/ns/reader' }
              ],
              type: 'Delete',
              object: {
                type: 'Publication',
                id: publication.id
              }
            })
          )

        const res = await request(app)
          .get(`${readerUrl}/library`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type(
            'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
          )
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
          .type(
            'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
          )
          .send(
            JSON.stringify({
              '@context': [
                'https://www.w3.org/ns/activitystreams',
                { reader: 'https://rebus.foundation/ns/reader' }
              ],
              type: 'Delete',
              object: {
                type: 'reader:Tag',
                id: collectionId
              }
            })
          )

        const res = await request(app)
          .get(`${readerUrl}/library`)
          .set('Host', 'reader-api.test')
          .set('Authorization', `Bearer ${token}`)
          .set('If-Modified-Since', time)
          .type(
            'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
          )
        await tap.equal(res.statusCode, 200)

        const body = res.body
        await tap.type(body, 'object')
        await tap.equal(body.type, 'Collection')

        time = new Date().getTime()
      }
    )
  }

  await destroyDB(app)
}

module.exports = test
