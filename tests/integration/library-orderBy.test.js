const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
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

  await createPublicationSimplified({
    name: 'Publication A',
    author: 'John Smith',
    editor: 'Jane Doe',
    datePublished: undefined
  })
  await createPublicationSimplified({ name: 'Publication 2' })
  await createPublicationSimplified({ name: 'Publication 3' })
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
  await createPublicationSimplified({ name: 'superbook' })
  await createPublicationSimplified({ name: 'Super great book!' })

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
  await createPublicationSimplified({ name: 'BBBB' })
  await createPublicationSimplified({ name: 'AAAA' })
  await createPublicationSimplified({ name: 'aabb' })
  await createPublicationSimplified({ name: 'ffff' })
  await createPublicationSimplified({ name: 'ffaa' })
  await createPublicationSimplified({ name: 'abc' })
  await createPublicationSimplified({ name: 'ccccc', author: 'anonymous' })
  await createPublicationSimplified({ name: 'zzz', author: 'Anonymous' })
  await createPublicationSimplified({ name: 'XXXX', author: 'anonyMOUS' })

  await tap.test('order library by title', async () => {
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

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
