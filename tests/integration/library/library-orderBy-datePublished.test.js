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

  const createSourceSimplified = async object => {
    return await createSource(app, token, object)
  }

  await createSourceSimplified({
    name: 'Source A',
    author: 'John Smith',
    editor: 'Jane Doe',
    datePublished: undefined
  })
  await createSourceSimplified({ name: 'Source 2' })
  await createSourceSimplified({ name: 'Source 3' })
  await createSourceSimplified({ name: 'Source 4' })
  await createSourceSimplified({ name: 'Source 5' })
  await createSourceSimplified({ name: 'Source 6' })
  await createSourceSimplified({ name: 'Source 7' })
  await createSourceSimplified({ name: 'Source 8' })
  await createSourceSimplified({ name: 'Source 9' })
  await createSourceSimplified({ name: 'Source 10' })
  await createSourceSimplified({ name: 'Source 11' })
  await createSourceSimplified({ name: 'Source 12' })
  await createSourceSimplified({ name: 'Source 13' })
  await createSourceSimplified({ name: 'superbook' })
  await createSourceSimplified({ name: 'Super great book!' })

  await createSourceSimplified({
    name: 'new book 1',
    author: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 2',
    author: `jo H. n'dOe`
  })
  await createSourceSimplified({
    name: 'new book 3',
    author: 'John Smith',
    editor: 'John doe'
  })
  await createSourceSimplified({
    name: 'new book 4',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 5',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 6',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 7',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 8',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 9',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 10',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 11',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 12',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 13',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 14',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 15',
    author: 'Jane Smith',
    editor: 'John Doe'
  })
  await createSourceSimplified({ name: 'BBBB' })
  await createSourceSimplified({ name: 'AAAA' })
  await createSourceSimplified({ name: 'aabb' })
  await createSourceSimplified({ name: 'ffff' })
  await createSourceSimplified({ name: 'ffaa' })
  await createSourceSimplified({ name: 'abc' })
  await createSourceSimplified({ name: 'ccccc', author: 'anonymous' })
  await createSourceSimplified({ name: 'zzz', author: 'Anonymous' })
  await createSourceSimplified({ name: 'XXXX', author: 'anonyMOUS' })

  // ---------------------------------------- DATE PUBLISHED -----------------------------------------

  await tap.test('Order Library by date published', async () => {
    await createSourceSimplified({
      name: 'source1 ggg',
      author: 'someone',
      editor: 'someone else',
      datePublished: new Date(2011, 3, 20).toISOString()
    })
    await createSourceSimplified({
      name: 'source2',
      author: 'someone new',
      editor: 'someone else',
      datePublished: new Date(2012, 3, 20).toISOString()
    })
    await createSourceSimplified({
      name: 'source3',
      author: 'someone',
      editor: 'someone else',
      datePublished: new Date(2001, 3, 20).toISOString()
    })
    await createSourceSimplified({
      name: 'source4 ggg',
      author: 'someone new',
      editor: 'someone else',
      datePublished: new Date(1011, 3, 20).toISOString()
    })
    await createSourceSimplified({
      name: 'source5',
      author: 'someone',
      editor: 'someone else',
      datePublished: new Date(2016, 3, 20).toISOString()
    })
    await createSourceSimplified({
      name: 'source6',
      author: 'someone new',
      editor: 'someone else',
      datePublished: new Date(2012, 1, 20).toISOString()
    })
    await createSourceSimplified({
      name: 'source7',
      author: 'someone',
      editor: 'someone new',
      datePublished: new Date(2011, 3, 22).toISOString()
    })

    const res = await request(app)
      .get(`/library?orderBy=datePublished`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    // most recent first
    await tap.equal(res.body.items[0].name, 'source5')
    await tap.equal(res.body.items[1].name, 'source2')
    await tap.equal(res.body.items[2].name, 'source6')
  })

  await tap.test('Order Library by datePublished, reversed', async () => {
    const res1 = await request(app)
      .get(`/library?orderBy=datePublished&reverse=true`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    // oldest first
    await tap.equal(res1.body.items[0].name, 'Source A') // has datePublished of null
    await tap.equal(res1.body.items[1].name, 'source4 ggg')
    await tap.equal(res1.body.items[2].name, 'source3')
  })

  await tap.test(
    'Order Library by datePublished with filter by title',
    async () => {
      const res2 = await request(app)
        .get(`/library?orderBy=datePublished&title=ggg`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
      await tap.equal(res2.body.items[0].name, 'source1 ggg')
      await tap.equal(res2.body.items[1].name, 'source4 ggg')
    }
  )

  await tap.test(
    'Order Library by datePublished with filter by author',
    async () => {
      const res3 = await request(app)
        .get(`/library?orderBy=datePublished&author=someone%20new`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
      await tap.equal(res3.body.items[0].name, 'source2')
      await tap.equal(res3.body.items[1].name, 'source6')
      await tap.equal(res3.body.items[2].name, 'source4 ggg')
    }
  )

  await tap.test(
    'Order Library by datePublished with filter by attribution',
    async () => {
      const res4 = await request(app)
        .get(`/library?orderBy=datePublished&attribution=new`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')
      await tap.equal(res4.body.items[0].name, 'source2')
      await tap.equal(res4.body.items[1].name, 'source6')
      await tap.equal(res4.body.items[2].name, 'source7')
      await tap.equal(res4.body.items[3].name, 'source4 ggg')
    }
  )

  await tap.test('Order Library by datePublished with pagination', async () => {
    const res = await request(app)
      .get(`/library?orderBy=datePublished&limit=13`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    // most recent first
    await tap.equal(res.body.items.length, 13)
  })

  await destroyDB(app)
}

module.exports = test
