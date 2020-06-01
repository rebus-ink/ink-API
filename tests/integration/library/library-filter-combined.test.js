const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  addSourceToCollection,
  createTag
} = require('../../utils/testUtils')
const app = require('../../../server').app
const { urlToId } = require('../../../utils/utils')
const _ = require('lodash')

const test = async () => {
  const token = getToken()
  await createUser(app, token)

  const createSourceSimplified = async object => {
    return await createSource(app, token, object)
  }

  await createSourceSimplified({
    name: 'Source A',
    author: 'John Smith',
    editor: 'Jane Doe'
  })

  const source = await createSourceSimplified({
    name: 'Source 2'
  })

  // source 3
  await createSourceSimplified({ name: 'Source 3' })

  // create a stack / tag
  const stack = await createTag(app, token)
  const tag1 = await createTag(app, token, { name: 'tag1' })

  // assign mystack to source B
  await addSourceToCollection(app, token, source.id, stack.id)

  await createSourceSimplified({ name: 'Source 4 test' })
  await createSourceSimplified({ name: 'Source 5' })
  await createSourceSimplified({ name: 'Source 6' })
  await createSourceSimplified({ name: 'Source 7 test' })
  await createSourceSimplified({ name: 'Source 8' })
  await createSourceSimplified({ name: 'Source 9' })
  await createSourceSimplified({
    name: 'Source 10',
    inLanguage: ['de', 'km']
  })
  await createSourceSimplified({
    name: 'Source 11',
    inLanguage: 'km'
  })
  await createSourceSimplified({ name: 'Source 12' })
  await createSourceSimplified({
    name: 'Source 13',
    inLanguage: ['km']
  })

  // get whole library to get ids:
  const resLibrary = await request(app)
    .get(`/library?limit=20`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')

  const library = resLibrary.body.items
  const sourceId1 = library[0].id
  const sourceId2 = library[1].id
  const sourceId3 = library[2].id
  const sourceId4 = library[3].id
  const sourceId5 = library[4].id
  const sourceId6 = library[5].id
  // skipping 7
  const sourceId8 = library[7].id
  const sourceId9 = library[8].id
  const sourceId10 = library[9].id
  const sourceId13 = library[12].id

  await addSourceToCollection(app, token, sourceId1, stack.id)
  await addSourceToCollection(app, token, sourceId2, stack.id)
  await addSourceToCollection(app, token, sourceId3, stack.id)
  await addSourceToCollection(app, token, sourceId4, stack.id)
  await addSourceToCollection(app, token, sourceId5, stack.id)
  await addSourceToCollection(app, token, sourceId6, stack.id)
  await addSourceToCollection(app, token, sourceId8, stack.id)
  await addSourceToCollection(app, token, sourceId9, stack.id)
  await addSourceToCollection(app, token, sourceId10, stack.id)
  await addSourceToCollection(app, token, sourceId13, stack.id)

  await createSourceSimplified({ name: 'superbook', author: 'anonymous' })
  await createSourceSimplified({
    name: 'Super great book!',
    author: 'anonymous'
  })

  await createSourceSimplified({
    name: 'new book 1',
    author: 'John Doe',
    type: 'Article',
    description: 'testing',
    keywords: ['word']
  })
  const source01 = await createSourceSimplified({
    name: 'new book 2 - the sequel',
    author: `jo H. n'dOe`,
    type: 'Article',
    abstract: 'testing',
    keywords: ['word']
  })
  await createSourceSimplified({
    name: 'new book 3',
    author: 'John Smith',
    editor: 'John doe',
    type: 'Article'
  })

  // adding for other attribution types
  await createSourceSimplified({
    name: 'new book 3b',
    contributor: 'John Doe',
    keywords: ['word']
  })
  await createSourceSimplified({
    name: 'new book 3c',
    creator: 'John Doe',
    keywords: ['word']
  })
  await createSourceSimplified({
    name: 'new book 3d',
    illustrator: 'John Doe',
    keywords: ['word']
  })
  await createSourceSimplified({
    name: 'new book 3e',
    sourcelisher: 'John Doe'
  })
  await createSourceSimplified({
    name: 'new book 3f',
    translator: 'John Doe'
  })

  const source02 = await createSourceSimplified({
    name: 'new book 4 - the sequel',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en'],
    keywords: ['word']
  })
  await createSourceSimplified({
    name: 'new book 5',
    author: 'Jane Smith testing',
    editor: 'John Doe',
    inLanguage: ['en']
  })
  await createSourceSimplified({
    name: 'new book 6',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en']
  })
  await createSourceSimplified({
    name: 'new book 7',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en']
  })
  await createSourceSimplified({
    name: 'new book 8 - the sequel',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en'],
    type: 'Article'
  })
  const source03 = await createSourceSimplified({
    name: 'new book 9 testing',
    author: 'Jane Smith',
    editor: 'John Doe',
    type: 'Article',
    inLanguage: ['en', 'km']
  })
  await createSourceSimplified({
    name: 'new book 10',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en'],
    keywords: 'word'
  })
  await createSourceSimplified({
    name: 'new book 11 testing',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en']
  })
  await createSourceSimplified({
    name: 'new book 12',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en']
  })
  await createSourceSimplified({
    name: 'new book 13',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en']
  })
  await createSourceSimplified({
    name: 'new book 14',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en', 'fr'],
    keywords: ['word']
  })
  await createSourceSimplified({
    name: 'new book 15 - the sequel',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['fr']
  })

  // add sources to collection
  await addSourceToCollection(app, token, urlToId(source01.id), tag1.id)
  await addSourceToCollection(app, token, urlToId(source02.id), tag1.id)
  await addSourceToCollection(app, token, urlToId(source03.id), tag1.id)
  await addSourceToCollection(app, token, sourceId1, tag1.id)
  await addSourceToCollection(app, token, sourceId2, tag1.id)

  await tap.test('filter by author and title', async () => {
    const res = await request(app)
      .get(`/library?author=Jane%20Smith&title=sequel`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body
    await tap.equal(body.totalItems, 3)
    await tap.equal(body.items.length, 3)
    await tap.ok(_.find(body.items, { name: 'new book 4 - the sequel' }))
    await tap.ok(_.find(body.items, { name: 'new book 8 - the sequel' }))
    await tap.ok(_.find(body.items, { name: 'new book 15 - the sequel' }))
  })

  await tap.test('filter by collection and language', async () => {
    const res = await request(app)
      .get(`/library?stack=mystack&language=km`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body
    await tap.equal(body.totalItems, 3)
    await tap.equal(body.items.length, 3)
    await tap.ok(_.find(body.items, { name: 'Source 10' }))
    await tap.ok(_.find(body.items, { name: 'Source 11' }))
    await tap.ok(_.find(body.items, { name: 'Source 13' }))
  })

  await tap.test('filter by author and language', async () => {
    const res = await request(app)
      .get(`/library?author=Jane%20Smith&language=km`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body
    await tap.equal(body.totalItems, 1)
    await tap.equal(body.items.length, 1)
    await tap.ok(_.find(body.items, { name: 'new book 9 testing' }))
  })

  await tap.test('filter by attribution and title', async () => {
    const res = await request(app)
      .get(`/library?attribution=John&title=sequel`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body
    await tap.equal(body.totalItems, 4)
    await tap.equal(body.items.length, 4)
    await tap.ok(_.find(body.items, { name: 'new book 15 - the sequel' }))
    await tap.ok(_.find(body.items, { name: 'new book 8 - the sequel' }))
    await tap.ok(_.find(body.items, { name: 'new book 4 - the sequel' }))
    await tap.ok(_.find(body.items, { name: 'new book 2 - the sequel' }))
  })

  await tap.test('filter by collection and title', async () => {
    const res = await request(app)
      .get(`/library?stack=mystack&title=test`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body
    await tap.equal(body.totalItems, 1)
    await tap.equal(body.items.length, 1)
    await tap.ok(_.find(body.items, { name: 'Source 4 test' }))
  })

  await tap.test('filter by author and type', async () => {
    const res = await request(app)
      .get(`/library?author=John%20Doe&type=Article`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body
    await tap.equal(body.totalItems, 2)
    await tap.equal(body.items.length, 2)
    await tap.ok(_.find(body.items, { name: 'new book 2 - the sequel' }))
    await tap.ok(_.find(body.items, { name: 'new book 1' }))
  })

  await tap.test('filter by attribution and type', async () => {
    const res = await request(app)
      .get(`/library?attribution=John%20Doe&type=Article`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body
    await tap.equal(body.totalItems, 5)
    await tap.equal(body.items.length, 5)
    await tap.ok(_.find(body.items, { name: 'new book 2 - the sequel' }))
    await tap.ok(_.find(body.items, { name: 'new book 1' }))
    await tap.ok(_.find(body.items, { name: 'new book 3' }))
    await tap.ok(_.find(body.items, { name: 'new book 8 - the sequel' }))
    await tap.ok(_.find(body.items, { name: 'new book 9 testing' }))
  })

  await tap.test('filter by title and type', async () => {
    const res = await request(app)
      .get(`/library?title=sequel&type=Article`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body
    await tap.equal(body.totalItems, 2)
    await tap.equal(body.items.length, 2)
    await tap.ok(_.find(body.items, { name: 'new book 2 - the sequel' }))
    await tap.ok(_.find(body.items, { name: 'new book 8 - the sequel' }))
  })

  await tap.test('filter by language and type', async () => {
    const res = await request(app)
      .get(`/library?language=km&type=Article`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body
    await tap.equal(body.totalItems, 1)
    await tap.equal(body.items.length, 1)
    await tap.ok(_.find(body.items, { name: 'new book 9 testing' }))
  })

  // Keywords

  await tap.test('filter by keyword and attribution', async () => {
    const res = await request(app)
      .get(`/library?keyword=word&attribution=John%20Doe`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body
    await tap.equal(body.totalItems, 8)
    await tap.equal(body.items.length, 8)
    await tap.ok(_.find(body.items, { name: 'new book 1' }))
    await tap.ok(_.find(body.items, { name: 'new book 2 - the sequel' }))
    await tap.ok(_.find(body.items, { name: 'new book 3b' }))
    await tap.ok(_.find(body.items, { name: 'new book 3c' }))
    await tap.ok(_.find(body.items, { name: 'new book 3d' }))
    await tap.ok(_.find(body.items, { name: 'new book 4 - the sequel' }))
    await tap.ok(_.find(body.items, { name: 'new book 10' }))
    await tap.ok(_.find(body.items, { name: 'new book 14' }))
  })

  await tap.test('filter by keyword and author', async () => {
    const res = await request(app)
      .get(`/library?keyword=word&author=John%20Doe`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body
    await tap.equal(body.totalItems, 2)
    await tap.equal(body.items.length, 2)
    await tap.ok(_.find(body.items, { name: 'new book 1' }))
    await tap.ok(_.find(body.items, { name: 'new book 2 - the sequel' }))
  })

  await tap.test('filter by keyword and language', async () => {
    const res = await request(app)
      .get(`/library?keyword=word&language=fr`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body
    await tap.equal(body.totalItems, 1)
    await tap.equal(body.items.length, 1)
    await tap.ok(_.find(body.items, { name: 'new book 14' }))
  })

  await tap.test('filter by keyword and title', async () => {
    const res = await request(app)
      .get(`/library?keyword=word&title=sequel`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body
    await tap.equal(body.totalItems, 2)
    await tap.equal(body.items.length, 2)
    await tap.ok(_.find(body.items, { name: 'new book 2 - the sequel' }))
    await tap.ok(_.find(body.items, { name: 'new book 4 - the sequel' }))
  })

  await tap.test('filter by keyword, author and title', async () => {
    const res = await request(app)
      .get(`/library?keyword=word&author=Jane%20Smith&title=sequel`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body
    await tap.equal(body.totalItems, 1)
    await tap.equal(body.items.length, 1)
    await tap.ok(_.find(body.items, { name: 'new book 4 - the sequel' }))
  })

  await tap.test('filter by keyword and type', async () => {
    const res = await request(app)
      .get(`/library?keyword=word&type=Article`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body
    await tap.equal(body.totalItems, 2)
    await tap.equal(body.items.length, 2)
    await tap.ok(_.find(body.items, { name: 'new book 1' }))
    await tap.ok(_.find(body.items, { name: 'new book 2 - the sequel' }))
  })

  await tap.test('filter by search and author', async () => {
    const res = await request(app)
      .get(`/library?search=testing&author=John%20Doe`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body
    await tap.equal(body.totalItems, 2)
    await tap.equal(body.items.length, 2)
    await tap.ok(_.find(body.items, { name: 'new book 1' }))
    await tap.ok(_.find(body.items, { name: 'new book 2 - the sequel' }))
  })

  await tap.test('filter by search and type', async () => {
    const res = await request(app)
      .get(`/library?search=testing&type=Article`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body
    await tap.equal(body.totalItems, 3)
    await tap.equal(body.items.length, 3)
    await tap.ok(_.find(body.items, { name: 'new book 1' }))
    await tap.ok(_.find(body.items, { name: 'new book 2 - the sequel' }))
    await tap.ok(_.find(body.items, { name: 'new book 9 testing' }))
  })

  await tap.test('filter by search and language', async () => {
    const res = await request(app)
      .get(`/library?search=testing&language=km`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body

    await tap.equal(body.totalItems, 1)
    await tap.equal(body.items.length, 1)
    await tap.ok(_.find(body.items, { name: 'new book 9 testing' }))
  })

  await tap.test('filter by search and title', async () => {
    const res = await request(app)
      .get(`/library?search=testing&title=sequel`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body

    await tap.equal(body.totalItems, 1)
    await tap.equal(body.items.length, 1)
    await tap.ok(_.find(body.items, { name: 'new book 2 - the sequel' }))
  })

  await tap.test('filter by tag and title', async () => {
    const res = await request(app)
      .get(`/library?tag=${tag1.id}&title=sequel`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body

    await tap.equal(body.totalItems, 2)
    await tap.equal(body.items.length, 2)
    await tap.ok(_.find(body.items, { name: 'new book 2 - the sequel' }))
    await tap.ok(_.find(body.items, { name: 'new book 4 - the sequel' }))
  })

  await tap.test('filter by tag and language', async () => {
    const res = await request(app)
      .get(`/library?tag=${tag1.id}&language=km`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body

    await tap.equal(body.totalItems, 2)
    await tap.equal(body.items.length, 2)
    await tap.ok(_.find(body.items, { name: 'new book 9 testing' }))
  })

  await tap.test('filter by tag and author', async () => {
    const res = await request(app)
      .get(`/library?tag=${tag1.id}&author=Jane%20Smith`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body

    await tap.equal(body.totalItems, 2)
    await tap.equal(body.items.length, 2)
    await tap.ok(_.find(body.items, { name: 'new book 4 - the sequel' }))
    await tap.ok(_.find(body.items, { name: 'new book 9 testing' }))
  })

  await tap.test('filter by tag and keyword', async () => {
    const res = await request(app)
      .get(`/library?tag=${tag1.id}&keyword=word`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body

    await tap.equal(body.totalItems, 2)
    await tap.equal(body.items.length, 2)
    await tap.ok(_.find(body.items, { name: 'new book 2 - the sequel' }))
    await tap.ok(_.find(body.items, { name: 'new book 4 - the sequel' }))
  })

  await tap.test('filter by tag and stack', async () => {
    const res = await request(app)
      .get(`/library?tag=${tag1.id}&stack=mystack`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body

    await tap.equal(body.totalItems, 2)
    await tap.equal(body.items.length, 2)
  })

  await destroyDB(app)
}

module.exports = test
