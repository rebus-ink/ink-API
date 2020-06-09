const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  addSourceToCollection,
  createNotebook,
  addSourceToNotebook,
  createTag
} = require('../../utils/testUtils')
const app = require('../../../server').app
const { urlToId } = require('../../../utils/utils')
const _ = require('lodash')

/*
1: auth: John Smith, ed: Jane Doe, mystack, tag1, notebook
2: mystack
3: mystack
4: 'test', stack, notebook
5: stack, ['km']
6: stack, ['km']
7: 'test', stack
8: stack
9: stack
10: ['de', 'km'], stack
11: ['km'], notebook
12: ['km'], stack, notebook
13: 'super', auth: anonymous
14: 'super', auth: anonymous
15: auth: John Doe, type: Article, abstract: 'test', ['word'], notebook
16: 'sequel', auth: John Doe, type: Article, abstract: 'test, ['word'], tag1
17: auth: John Smith, ed: John Doe, type: Article
18: contributor: John Doe ['word']
19: creator: John Doe ['word']
20: illustrator: John Doe ['word']
21: publisher: John Doe
22: translator: John Doe
23: 'sequel', auth: Jane Smith, ed: John Doe, ['en'], ['word'], tag1, notebook
24: auth: Jane Smith testing, ed: John Doe, ['en']
25: auth: Jane Smith, ed: John Doe, ['en']
26: auth: Jane Smith, ed: John Doe, ['en']
27: 'sequel', auth: Jane Smith, ed: John Doe, ['en'], Article
28: 'testing', auth: Jane Smith, ed: John Doe, ['en', 'km'], Article, tag1, notebook
29: auth: Jane Smith, ed: John Doe, ['en'], ['word']
30: 'testing', auth: Jane Smith, ed: John Doe, ['en'], ['word']
31: auth: Jane Smith, ed: John Doe, ['en'], ['word']
32: auth: Jane Smith, ed: John Doe, ['en'], ['word'],
33: auth: Jane Smith, ed: John Doe, ['en', 'fr'], ['word']
34: 'sequel', auth: Jane Smith, ed: John Doe, ['fr'], notebook

*/

const test = async () => {
  const token = getToken()
  await createUser(app, token)

  const createSourceSimplified = async object => {
    return await createSource(app, token, object)
  }

  const source1 = await createSourceSimplified({
    name: 'Source A',
    author: 'John Smith',
    editor: 'Jane Doe'
  })

  const source2 = await createSourceSimplified({
    name: 'Source 2'
  })

  const source3 = await createSourceSimplified({ name: 'Source 3' })

  // create a stack / tag
  const stack = await createTag(app, token, { name: 'mystack' })
  const tag1 = await createTag(app, token, { name: 'tag1' })

  // assign mystack to source B
  await addSourceToCollection(app, token, urlToId(sourceId2), stack.id)

  const source4 = await createSourceSimplified({ name: 'Source 4 test' })
  const source5 = await createSourceSimplified({
    name: 'Source 5',
    inLanguage: ['km']
  })
  const source6 = await createSourceSimplified({
    name: 'Source 6',
    inLanguage: ['km']
  })
  // 7
  await createSourceSimplified({ name: 'Source 7 test' })
  const source8 = await createSourceSimplified({ name: 'Source 8' })
  const source9 = await createSourceSimplified({ name: 'Source 9' })
  const source10 = await createSourceSimplified({
    name: 'Source 10',
    inLanguage: ['de', 'km']
  })
  const source11 = await createSourceSimplified({
    name: 'Source 11',
    inLanguage: 'km'
  })
  const source12 = await createSourceSimplified({
    name: 'Source 12',
    inLanguage: ['km']
  })

  const notebook = await createNotebook(app, token, { name: 'something' })

  await addSourceToCollection(app, token, source1.shortId, stack.id)
  await addSourceToCollection(app, token, source2.shortId, stack.id)
  await addSourceToCollection(app, token, source3.shortId, stack.id)
  await addSourceToCollection(app, token, source4.shortId, stack.id)
  await addSourceToCollection(app, token, source5.shortId, stack.id)
  await addSourceToCollection(app, token, source6.shortId, stack.id)
  await addSourceToCollection(app, token, source8.shortId, stack.id)
  await addSourceToCollection(app, token, source9.shortId, stack.id)
  await addSourceToCollection(app, token, source10.shortId, stack.id)
  await addSourceToCollection(app, token, source12.shortId, stack.id)

  // 13
  await createSourceSimplified({ name: 'superbook', author: 'anonymous' })
  // 14
  await createSourceSimplified({
    name: 'Super great book!',
    author: 'anonymous'
  })

  // 15
  const source15 = await createSourceSimplified({
    name: 'new book 1',
    author: 'John Doe',
    type: 'Article',
    description: 'testing',
    keywords: ['word']
  })
  // 16
  const source16 = await createSourceSimplified({
    name: 'new book 2 - the sequel',
    author: `jo H. n'dOe`,
    type: 'Article',
    abstract: 'testing',
    keywords: ['word']
  })
  // 17
  await createSourceSimplified({
    name: 'new book 3',
    author: 'John Smith',
    editor: 'John doe',
    type: 'Article'
  })

  // adding for other attribution types
  // 18
  await createSourceSimplified({
    name: 'new book 3b',
    contributor: 'John Doe',
    keywords: ['word']
  })
  // 19
  await createSourceSimplified({
    name: 'new book 3c',
    creator: 'John Doe',
    keywords: ['word']
  })
  // 20
  await createSourceSimplified({
    name: 'new book 3d',
    illustrator: 'John Doe',
    keywords: ['word']
  })
  // 21
  await createSourceSimplified({
    name: 'new book 3e',
    publisher: 'John Doe'
  })
  // 22
  await createSourceSimplified({
    name: 'new book 3f',
    translator: 'John Doe'
  })

  // 23
  const source23 = await createSourceSimplified({
    name: 'new book 4 - the sequel',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en'],
    keywords: ['word']
  })
  // 24
  await createSourceSimplified({
    name: 'new book 5',
    author: 'Jane Smith testing',
    editor: 'John Doe',
    inLanguage: ['en']
  })
  // 25
  await createSourceSimplified({
    name: 'new book 6',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en']
  })
  // 26
  await createSourceSimplified({
    name: 'new book 7',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en']
  })
  // 27
  await createSourceSimplified({
    name: 'new book 8 - the sequel',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en'],
    type: 'Article'
  })
  // 28
  const source28 = await createSourceSimplified({
    name: 'new book 9 testing',
    author: 'Jane Smith',
    editor: 'John Doe',
    type: 'Article',
    inLanguage: ['en', 'km']
  })
  // 29
  await createSourceSimplified({
    name: 'new book 10',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en'],
    keywords: 'word'
  })
  // 30
  await createSourceSimplified({
    name: 'new book 11 testing',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en']
  })
  // 31
  await createSourceSimplified({
    name: 'new book 12',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en']
  })
  // 32
  await createSourceSimplified({
    name: 'new book 13',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en']
  })
  // 33
  await createSourceSimplified({
    name: 'new book 14',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['en', 'fr'],
    keywords: ['word']
  })
  // 34
  const source34 = await createSourceSimplified({
    name: 'new book 15 - the sequel',
    author: 'Jane Smith',
    editor: 'John Doe',
    inLanguage: ['fr']
  })

  // add sources to notebook
  await addSourceToNotebook(app, token, source1.shortId, notebook.shortId)
  await addSourceToNotebook(app, token, source4.shortId, notebook.shortId)
  await addSourceToNotebook(app, token, source11.shortId, notebook.shortId)
  await addSourceToNotebook(app, token, source12.shortId, notebook.shortId)
  await addSourceToNotebook(app, token, source15.shortId, notebook.shortId)
  await addSourceToNotebook(app, token, source23.shortId, notebook.shortId)
  await addSourceToNotebook(app, token, source28.shortId, notebook.shortId)
  await addSourceToNotebook(app, token, source34.shortId, notebook.shortId)

  // add sources to collection
  await addSourceToCollection(app, token, source16.shortId, tag1.id)
  await addSourceToCollection(app, token, source23.shortId, tag1.id)
  await addSourceToCollection(app, token, source28.shortId, tag1.id)
  await addSourceToCollection(app, token, source1.shortId, tag1.id)
  await addSourceToCollection(app, token, source2.shortId, tag1.id)

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
    await tap.equal(body.totalItems, 4)
    await tap.equal(body.items.length, 4)
    await tap.ok(_.find(body.items, { name: 'Source 10' }))
    await tap.ok(_.find(body.items, { name: 'Source 5' }))
    await tap.ok(_.find(body.items, { name: 'Source 6' }))
    await tap.ok(_.find(body.items, { name: 'Source 12' }))
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

    await tap.equal(body.totalItems, 1)
    await tap.equal(body.items.length, 1)
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

  await tap.test('filter by notebook and attribution', async () => {
    const res = await request(app)
      .get(`/library?notebook=${notebook.shortId}&attribution=Jane%20Doe`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body

    await tap.equal(body.totalItems, 1)
    await tap.equal(body.items.length, 1)
    await tap.ok(_.find(body.items, { shortId: source1.shortId }))
  })

  await tap.test('filter by notebook and keyword', async () => {
    const res = await request(app)
      .get(`/library?notebook=${notebook.shortId}&keyword=word`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body

    await tap.equal(body.totalItems, 2)
    await tap.equal(body.items.length, 2)
    await tap.ok(_.find(body.items, { shortId: source15.shortId }))
    await tap.ok(_.find(body.items, { shortId: source23.shortId }))
  })

  await tap.test('filter by notebook and language', async () => {
    const res = await request(app)
      .get(`/library?notebook=${notebook.shortId}&language=km`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body

    await tap.equal(body.totalItems, 3)
    await tap.equal(body.items.length, 3)
    await tap.ok(_.find(body.items, { shortId: source11.shortId }))
    await tap.ok(_.find(body.items, { shortId: source12.shortId }))
    await tap.ok(_.find(body.items, { shortId: source28.shortId }))
  })

  await tap.test('filter by notebook and search', async () => {
    const res = await request(app)
      .get(`/library?notebook=${notebook.shortId}&search=test`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body

    await tap.equal(body.totalItems, 3)
    await tap.equal(body.items.length, 3)
    await tap.ok(_.find(body.items, { shortId: source4.shortId }))
    await tap.ok(_.find(body.items, { shortId: source15.shortId }))
    await tap.ok(_.find(body.items, { shortId: source28.shortId }))
  })

  await tap.test('filter by notebook and tag', async () => {
    const res = await request(app)
      .get(`/library?notebook=${notebook.shortId}&tag=${tag1.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body

    await tap.equal(body.totalItems, 3)
    await tap.equal(body.items.length, 3)
    await tap.ok(_.find(body.items, { shortId: source1.shortId }))
    await tap.ok(_.find(body.items, { shortId: source23.shortId }))
    await tap.ok(_.find(body.items, { shortId: source28.shortId }))
  })

  await tap.test('filter by notebook and title', async () => {
    const res = await request(app)
      .get(`/library?notebook=${notebook.shortId}&title=sequel`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body

    await tap.equal(body.totalItems, 2)
    await tap.equal(body.items.length, 2)
    await tap.ok(_.find(body.items, { shortId: source23.shortId }))
    await tap.ok(_.find(body.items, { shortId: source34.shortId }))
  })

  await tap.test('filter by notebook and type', async () => {
    const res = await request(app)
      .get(`/library?notebook=${notebook.shortId}&type=Article`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    const body = res.body

    await tap.equal(body.totalItems, 2)
    await tap.equal(body.items.length, 2)
    await tap.ok(_.find(body.items, { shortId: source15.shortId }))
    await tap.ok(_.find(body.items, { shortId: source28.shortId }))
  })

  await destroyDB(app)
}

module.exports = test
