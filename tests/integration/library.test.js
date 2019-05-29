const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  getActivityFromUrl,
  createPublication
} = require('../utils/utils')
const app = require('../../server').app

const test = async () => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const readerCompleteUrl = await createUser(app, token)
  const readerUrl = urlparse(readerCompleteUrl).path

  const createPublicationSimplified = async object => {
    return await createPublication(app, token, readerUrl, object)
  }

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

  await tap.test('Add publication and get library', async () => {
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
          type: 'Create',
          object: {
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
          }
        })
      )

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
    // documents should NOT include:
    await tap.notOk(body.items[0].resources)
    await tap.notOk(body.items[0].readingOrder)
    await tap.notOk(body.items[0].links)
    await tap.notOk(body.items[0].json)
  })

  await tap.test('filter library by collection', async () => {
    // add more publications
    // publication 2
    const pubBres = await createPublicationSimplified({ name: 'Publication 2' })

    const pubActivityUrl = pubBres.get('Location')
    const pubActivityObject = await getActivityFromUrl(
      app,
      pubActivityUrl,
      token
    )
    const publication = pubActivityObject.object

    // publication 3
    await createPublicationSimplified({ name: 'Publication 3' })

    // create a stack
    const stackRes = await request(app)
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
          type: 'Create',
          object: {
            type: 'reader:Stack',
            name: 'mystack'
          }
        })
      )

    const stackActivityUrl = stackRes.get('Location')
    const stackActivityObject = await getActivityFromUrl(
      app,
      stackActivityUrl,
      token
    )

    const stack = stackActivityObject.object
    // assign mystack to publication B
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
          type: 'Add',
          object: { id: stack.id, type: 'reader:Stack' },
          target: { id: publication.id, type: 'Publication' }
        })
      )

    // get library with filter for collection
    const res = await request(app)
      .get(`${readerUrl}/library?stack=mystack`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 1)
    await tap.ok(Array.isArray(body.items))
    // documents should include:
    await tap.equal(body.items[0].name, 'Publication 2')
  })

  await tap.test('paginate library', async () => {
    // add more publications
    await createPublicationSimplified({ name: 'Publication 4' })
    await createPublicationSimplified({ name: 'Publication 5' })
    await createPublicationSimplified({ name: 'Publication 6' })
    await createPublicationSimplified({ name: 'Publication 7' })
    await createPublicationSimplified({ name: 'Publication 8' })
    await createPublicationSimplified({ name: 'Publication 9' })
    await createPublicationSimplified({ name: 'Publication 10' })
    await createPublicationSimplified({ name: 'Publication 11' })
    await createPublicationSimplified({ name: 'Publication 12' })
    await createPublicationSimplified({ name: 'Publication 13' })

    // get library with pagination
    const res = await request(app)
      .get(`${readerUrl}/library?limit=10`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.statusCode, 200)

    const body = res.body
    await tap.type(body, 'object')
    await tap.equal(body.totalItems, 10)
    await tap.ok(Array.isArray(body.items))
    // documents should include:
    await tap.equal(body.items.length, 10)
    await tap.equal(body.items[0].name, 'Publication 13')
    await tap.equal(body.items[9].name, 'Publication 4')
    await tap.equal(body.page, 1)
    await tap.equal(body.pageSize, 10)

    // get page 2
    const res2 = await request(app)
      .get(`${readerUrl}/library?page=2&limit=10`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.statusCode, 200)

    const body2 = res2.body
    await tap.type(body2, 'object')
    await tap.equal(body2.totalItems, 3)
    await tap.ok(Array.isArray(body2.items))
    // documents should include:
    await tap.equal(body2.items.length, 3)
    await tap.equal(body2.items[0].name, 'Publication 3')
    await tap.equal(body2.items[2].name, 'Publication A')
    await tap.equal(body2.page, 2)
    await tap.equal(body2.pageSize, 10)

    // testing limit
    const res3 = await request(app)
      .get(`${readerUrl}/library?page=1&limit=0`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res3.body.totalItems, 10)

    // testing default
    const res4 = await request(app)
      .get(`${readerUrl}/library`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res4.body.totalItems, 10)
  })

  await tap.test('filter library by title', async () => {
    await createPublicationSimplified({ name: 'superbook' })
    await createPublicationSimplified({ name: 'Super great book!' })

    const res = await request(app)
      .get(`${readerUrl}/library?title=super`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 2)
    await tap.ok(res.body.items)
    await tap.equal(res.body.items[0].name, 'Super great book!')

    // should work with limit
    const res2 = await request(app)
      .get(`${readerUrl}/library?title=publication`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.body.totalItems, 10)

    const res3 = await request(app)
      .get(`${readerUrl}/library?title=publication&limit=11`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res3.body.totalItems, 11)

    // should return 0 items if none found
    const res4 = await request(app)
      .get(`${readerUrl}/library?title=ansoiwereow`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res4.body.totalItems, 0)
  })

  await tap.test('filter library by attribution', async () => {
    await createPublicationSimplified({
      name: 'new book 1',
      author: 'John Doe'
    })
    await createPublicationSimplified({
      name: 'new book 2',
      author: `jo H. n'dOe`
    })
    await createPublicationSimplified({
      name: 'new book 3',
      author: 'John Smith',
      editor: 'John doe'
    })

    const res = await request(app)
      .get(`${readerUrl}/library?attribution=John%20Doe`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res.status, 200)
    await tap.ok(res.body)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    // should @context be an object or a string?
    await tap.type(body['@context'], 'string')
    await tap.equal(body.type, 'Collection')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 3)
    await tap.ok(Array.isArray(body.items))
    // documents should include:
    await tap.equal(body.items[0].type, 'Publication')
    await tap.type(body.items[0].id, 'string')
    await tap.type(body.items[0].name, 'string')
    await tap.equal(body.items[0].name, 'new book 3')
    await tap.equal(body.items[0].author[0].name, 'John Smith')
    // documents should NOT include:
    await tap.notOk(body.items[0].resources)
    await tap.notOk(body.items[0].readingOrder)
    await tap.notOk(body.items[0].links)
    await tap.notOk(body.items[0].json)

    // should work with partial match
    const res1 = await request(app)
      .get(`${readerUrl}/library?attribution=John d`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res1.body.items.length, 3)

    // should work with limit
    await createPublicationSimplified({
      name: 'new book 4',
      author: 'Jane Smith',
      editor: 'John Doe'
    })
    await createPublicationSimplified({
      name: 'new book 5',
      author: 'Jane Smith',
      editor: 'John Doe'
    })
    await createPublicationSimplified({
      name: 'new book 6',
      author: 'Jane Smith',
      editor: 'John Doe'
    })
    await createPublicationSimplified({
      name: 'new book 7',
      author: 'Jane Smith',
      editor: 'John Doe'
    })
    await createPublicationSimplified({
      name: 'new book 8',
      author: 'Jane Smith',
      editor: 'John Doe'
    })
    await createPublicationSimplified({
      name: 'new book 9',
      author: 'Jane Smith',
      editor: 'John Doe'
    })
    await createPublicationSimplified({
      name: 'new book 10',
      author: 'Jane Smith',
      editor: 'John Doe'
    })
    await createPublicationSimplified({
      name: 'new book 11',
      author: 'Jane Smith',
      editor: 'John Doe'
    })
    await createPublicationSimplified({
      name: 'new book 12',
      author: 'Jane Smith',
      editor: 'John Doe'
    })
    await createPublicationSimplified({
      name: 'new book 13',
      author: 'Jane Smith',
      editor: 'John Doe'
    })
    await createPublicationSimplified({
      name: 'new book 14',
      author: 'Jane Smith',
      editor: 'John Doe'
    })
    await createPublicationSimplified({
      name: 'new book 15',
      author: 'Jane Smith',
      editor: 'John Doe'
    })

    const res2 = await request(app)
      .get(`${readerUrl}/library?attribution=John%20Doe`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.body.items.length, 10)

    const res3 = await request(app)
      .get(`${readerUrl}/library?attribution=John%20Doe&limit=11`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res3.body.items.length, 11)

    const res4 = await request(app)
      .get(`${readerUrl}/library?attribution=John%20Doe&limit=11&page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res4.body.items.length, 4)
  })

  await tap.test('filter library by attribution with role', async () => {
    const res = await request(app)
      .get(`${readerUrl}/library?attribution=John%20D&role=author`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.items.length, 2)

    // should work with editor and with pagination
    const res2 = await request(app)
      .get(`${readerUrl}/library?attribution=John%20D&role=editor`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.body.items.length, 10)

    const res3 = await request(app)
      .get(`${readerUrl}/library?attribution=John%20D&role=editor&page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res3.body.items.length, 3)
  })

  await tap.test('filter library by author', async () => {
    const res = await request(app)
      .get(`${readerUrl}/library?author=John%20Doe`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res.status, 200)
    await tap.ok(res.body)

    const body = res.body
    await tap.type(body, 'object')
    await tap.type(body.id, 'string')
    // should @context be an object or a string?
    await tap.type(body['@context'], 'string')
    await tap.equal(body.type, 'Collection')
    await tap.type(body.totalItems, 'number')
    await tap.equal(body.totalItems, 2)
    await tap.ok(Array.isArray(body.items))
    // documents should include:
    await tap.equal(body.items[0].type, 'Publication')
    await tap.type(body.items[0].id, 'string')
    await tap.type(body.items[0].name, 'string')
    await tap.equal(body.items[0].name, 'new book 2')
    await tap.equal(body.items[0].author[0].name, `jo H. n'dOe`)
    // documents should NOT include:
    await tap.notOk(body.items[0].resources)
    await tap.notOk(body.items[0].readingOrder)
    await tap.notOk(body.items[0].links)
    await tap.notOk(body.items[0].json)

    // should work with limit
    const res2 = await request(app)
      .get(`${readerUrl}/library?author=JaneSmith`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.body.items.length, 10)

    const res3 = await request(app)
      .get(`${readerUrl}/library?author=JaneSmith&limit=11`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res3.body.items.length, 11)

    const res4 = await request(app)
      .get(`${readerUrl}/library?author=JaneSmith&limit=11&page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res4.body.items.length, 1)
  })

  await tap.test('order library by title', async () => {
    await createPublicationSimplified({ name: 'BBBB' })
    await createPublicationSimplified({ name: 'AAAA' })
    await createPublicationSimplified({ name: 'aabb' })
    await createPublicationSimplified({ name: 'ffff' })
    await createPublicationSimplified({ name: 'ffaa' })
    await createPublicationSimplified({ name: 'abc' })
    await createPublicationSimplified({ name: 'ccccc', author: 'anonymous' })
    await createPublicationSimplified({ name: 'zzz', author: 'Anonymous' })
    await createPublicationSimplified({ name: 'XXXX', author: 'anonyMOUS' })

    const res = await request(app)
      .get(`${readerUrl}/library?orderBy=title`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res.body.items[0].name, 'AAAA')
    await tap.equal(res.body.items[1].name, 'aabb')
    await tap.equal(res.body.items[2].name, 'abc')

    // with other filters:
    const res1 = await request(app)
      .get(`${readerUrl}/library?orderBy=title&title=b`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res1.body.items[0].name, 'aabb')
    await tap.equal(res1.body.items[1].name, 'abc')

    const res2 = await request(app)
      .get(`${readerUrl}/library?orderBy=title&author=anonymous`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.body.items.length, 3)

    await tap.equal(res2.body.items[0].name, 'ccccc')
    await tap.equal(res2.body.items[1].name, 'XXXX')
    await tap.equal(res2.body.items[2].name, 'zzz')

    const res3 = await request(app)
      .get(`${readerUrl}/library?orderBy=title&attribution=anonymous`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res3.body.items.length, 3)

    await tap.equal(res3.body.items[0].name, 'ccccc')
    await tap.equal(res3.body.items[1].name, 'XXXX')
    await tap.equal(res3.body.items[2].name, 'zzz')
  })

  await tap.test('order library by title, reversed', async () => {
    const res = await request(app)
      .get(`${readerUrl}/library?orderBy=title&reverse=true`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res.body.items[0].name, 'zzz')
    await tap.equal(res.body.items[1].name, 'XXXX')

    // with other filters:
    const res1 = await request(app)
      .get(`${readerUrl}/library?orderBy=title&title=ff&reverse=true`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res1.body.items[0].name, 'ffff')
    await tap.equal(res1.body.items[1].name, 'ffaa')

    const res2 = await request(app)
      .get(`${readerUrl}/library?orderBy=title&author=anonymous&reverse=true`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.body.items.length, 3)

    await tap.equal(res2.body.items[0].name, 'zzz')
    await tap.equal(res2.body.items[1].name, 'XXXX')
    await tap.equal(res2.body.items[2].name, 'ccccc')

    const res3 = await request(app)
      .get(
        `${readerUrl}/library?orderBy=title&attribution=anonymous&reverse=true`
      )
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res3.body.items.length, 3)

    await tap.equal(res3.body.items[0].name, 'zzz')
    await tap.equal(res3.body.items[1].name, 'XXXX')
    await tap.equal(res3.body.items[2].name, 'ccccc')
  })

  await tap.test('order by date published', async () => {
    await createPublicationSimplified({
      name: 'pub1 ggg',
      author: 'someone',
      editor: 'someone else',
      datePublished: new Date(2011, 3, 20).toISOString()
    })
    await createPublicationSimplified({
      name: 'pub2',
      author: 'someone new',
      editor: 'someone else',
      datePublished: new Date(2012, 3, 20).toISOString()
    })
    await createPublicationSimplified({
      name: 'pub3',
      author: 'someone',
      editor: 'someone else',
      datePublished: new Date(2001, 3, 20).toISOString()
    })
    await createPublicationSimplified({
      name: 'pub4 ggg',
      author: 'someone new',
      editor: 'someone else',
      datePublished: new Date(1011, 3, 20).toISOString()
    })
    await createPublicationSimplified({
      name: 'pub5',
      author: 'someone',
      editor: 'someone else',
      datePublished: new Date(2016, 3, 20).toISOString()
    })
    await createPublicationSimplified({
      name: 'pub6',
      author: 'someone new',
      editor: 'someone else',
      datePublished: new Date(2012, 1, 20).toISOString()
    })
    await createPublicationSimplified({
      name: 'pub7',
      author: 'someone',
      editor: 'someone new',
      datePublished: new Date(2011, 3, 22).toISOString()
    })

    const res = await request(app)
      .get(`${readerUrl}/library?orderBy=datePublished`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    // most recent first
    await tap.equal(res.body.items[0].name, 'pub5')
    await tap.equal(res.body.items[1].name, 'pub2')
    await tap.equal(res.body.items[2].name, 'pub6')

    // reverse
    const res1 = await request(app)
      .get(`${readerUrl}/library?orderBy=datePublished&reverse=true`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    // oldest first
    await tap.equal(res1.body.items[0].name, 'Publication A') // has datePublished of null
    await tap.equal(res1.body.items[1].name, 'pub4 ggg')
    await tap.equal(res1.body.items[2].name, 'pub3')

    // with other filters
    const res2 = await request(app)
      .get(`${readerUrl}/library?orderBy=datePublished&title=ggg`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res2.body.items[0].name, 'pub1 ggg')
    await tap.equal(res2.body.items[1].name, 'pub4 ggg')

    const res3 = await request(app)
      .get(`${readerUrl}/library?orderBy=datePublished&author=someone%20new`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res3.body.items[0].name, 'pub2')
    await tap.equal(res3.body.items[1].name, 'pub6')
    await tap.equal(res3.body.items[2].name, 'pub4 ggg')

    const res4 = await request(app)
      .get(`${readerUrl}/library?orderBy=datePublished&attribution=new`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res4.body.items[0].name, 'pub2')
    await tap.equal(res4.body.items[1].name, 'pub6')
    await tap.equal(res4.body.items[2].name, 'pub7')
    await tap.equal(res4.body.items[3].name, 'pub4 ggg')
  })

  await tap.test(
    'Try to get library for reader that does not exist',
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

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
