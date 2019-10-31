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
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

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
      type: 'Publication',
      name: 'Publication A',
      author: ['John Smith'],
      editor: 'Jane Doe',
      description: 'this is a description!!',
      keywords: 'one, two',
      links: [{ property: 'value' }],
      readingOrder: [{ name: 'one' }, { name: 'two' }, { name: 'three' }],
      resources: [{ property: 'value' }],
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
    await tap.equal(body.items[0].type, 'Publication')
    await tap.type(body.items[0].id, 'string')
    await tap.type(body.items[0].name, 'string')
    await tap.equal(body.items[0].name, 'Publication A')
    await tap.equal(body.items[0].author[0].name, 'John Smith')
    await tap.equal(body.items[0].editor[0].name, 'Jane Doe')
    await tap.equal(body.items[0].keywords, 'one, two')
    await tap.ok(body.items[0].json)
    await tap.ok(body.items[0].resources)
    // documents should NOT include:
    await tap.notOk(body.items[0].readingOrder)
    await tap.notOk(body.items[0].links)
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
              description: 'new description!'
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
      const removeRes = await request(app)
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

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
