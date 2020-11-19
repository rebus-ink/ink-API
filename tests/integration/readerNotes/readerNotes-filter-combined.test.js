const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createNote,
  createTag,
  addNoteToCollection,
  createNotebook,
  addNoteToNotebook
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')
const _ = require('lodash')

/*
1: testCollection, notebook
2: highlighting
3: sourceId2, highlighting, doc1, testCollection
4: sourceId2, testCollection
5: sourceId2, doc1, highlighting, 'abc' testCollection, tag2, flag: question, notebook, colour: colour1
6: sourceId2, tag2
7: sourceId2, tag2, notebook
8: sourceId2
9: sourceId2, notebook, colour: colour1
10: sourceId2, test, 'abc'
11: sourceId2, doc2, test, 'abc', colour: colour1
12: sourceId2
13: sourceId2, doc1, test, 'abc', notebook
14: sourceId2, doc1, highlighting, 'something', notebook
15: sourceId2

*/

const test = async app => {
  const token = getToken()
  await createUser(app, token)

  const source = await createSource(app, token, {
    name: 'Source A'
  })
  const sourceUrl = source.id
  const sourceId1 = urlToId(sourceUrl)

  // create another source
  const source2 = await createSource(app, token, {
    name: 'Source B'
  })
  const sourceUrl2 = source2.id
  const sourceId2 = urlToId(sourceUrl2)

  const createNoteSimplified = async object => {
    const noteObj = Object.assign(
      {
        sourceId: sourceId1,
        body: { motivation: 'test' }
      },
      object
    )
    return await createNote(app, token, noteObj)
  }

  const note1 = await createNoteSimplified() // collection
  // 2
  await createNoteSimplified({ body: { motivation: 'highlighting' } })

  // create more notes for another source
  const note3 = await createNoteSimplified({
    // collection
    sourceId: sourceId2,
    body: { motivation: 'highlighting' },
    document: 'doc1'
  })
  const note4 = await createNoteSimplified({
    // collection
    sourceId: sourceId2,
    document: 'doc1'
  })

  const note5 = await createNoteSimplified({
    // collection & flag & colour1
    sourceId: sourceId2,
    document: 'doc1',
    body: { motivation: 'highlighting', content: 'this contains abc' }
  })
  // 6
  const note6 = await createNoteSimplified({
    sourceId: sourceId2
  })
  // 7
  const note7 = await createNoteSimplified({
    sourceId: sourceId2
  })
  // 8
  await createNoteSimplified({
    sourceId: sourceId2
  })
  // 9
  const note9 = await createNoteSimplified({
    sourceId: sourceId2
  })
  // 10
  await createNoteSimplified({
    sourceId: sourceId2,
    body: { motivation: 'test', content: 'a!bc' }
  })
  // 11
  const note11 = await createNoteSimplified({
    sourceId: sourceId2,
    document: 'doc2',
    body: { motivation: 'test', content: 'this contains abc' }
  })
  // 12
  await createNoteSimplified({
    sourceId: sourceId2
  })
  // 13
  const note13 = await createNoteSimplified({
    sourceId: sourceId2,
    document: 'doc1',
    body: { motivation: 'test', content: 'ABCDE' }
  })
  // 14
  const note14 = await createNoteSimplified({
    sourceId: sourceId2,
    document: 'doc1',
    body: { motivation: 'highlighting', content: 'something' }
  })
  // 15
  await createNoteSimplified({
    sourceId: sourceId2
  })

  const tagCreated = await createTag(app, token, {
    name: 'testCollection'
  })
  const tagId = tagCreated.id
  // add 3 notes to this collection
  await addNoteToCollection(app, token, note1.shortId, tagId)
  await addNoteToCollection(app, token, note3.shortId, tagId)
  await addNoteToCollection(app, token, note4.shortId, tagId)
  await addNoteToCollection(app, token, note5.shortId, tagId)

  const tag2 = await createTag(app, token)
  const tagsres = await request(app)
    .get(`/tags`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')

  const questionTagId = _.find(tagsres.body, { name: 'question' }).id
  const colour1TagId = _.find(tagsres.body, { name: 'colour1' }).id

  // assign notes to tag
  await addNoteToCollection(app, token, note5.shortId, tag2.id)
  await addNoteToCollection(app, token, note6.shortId, tag2.id)
  await addNoteToCollection(app, token, note7.shortId, tag2.id)

  // assign notes to flag
  await addNoteToCollection(app, token, note5.shortId, questionTagId)

  // assign notes to colour1
  await addNoteToCollection(app, token, note5.shortId, colour1TagId)
  await addNoteToCollection(app, token, note9.shortId, colour1TagId)
  await addNoteToCollection(app, token, note11.shortId, colour1TagId)

  // notebook
  const notebook = await createNotebook(app, token, { name: 'notebook1' })

  await addNoteToNotebook(app, token, note1.shortId, notebook.shortId)
  await addNoteToNotebook(app, token, note5.shortId, notebook.shortId)
  await addNoteToNotebook(app, token, note7.shortId, notebook.shortId)
  await addNoteToNotebook(app, token, note9.shortId, notebook.shortId)
  await addNoteToNotebook(app, token, note13.shortId, notebook.shortId)
  await addNoteToNotebook(app, token, note14.shortId, notebook.shortId)

  await tap.test('Filter Notes by motivation and SourceId', async () => {
    const res2 = await request(app)
      .get(`/notes?motivation=highlighting&source=${sourceUrl2}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 3)
    await tap.equal(res2.body.items.length, 3)
  })

  await tap.test('Search Notes and filter by motivation', async () => {
    const res2 = await request(app)
      .get(`/notes?search=abc&motivation=highlighting`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.equal(res2.body.totalItems, 1)
    await tap.equal(res2.body.items.length, 1)
  })

  await tap.test('Filter Notes by motivation and collection', async () => {
    const res2 = await request(app)
      .get(`/notes?motivation=highlighting&stack=testCollection`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 2)
    await tap.equal(res2.body.items.length, 2)
  })

  await tap.test('Filter Notes by motivation and tagId', async () => {
    const res2 = await request(app)
      .get(`/notes?motivation=highlighting&tag=${tag2.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 1)
    await tap.equal(res2.body.items.length, 1)
  })

  await tap.test('Filter Notes by collection and tagId', async () => {
    const res2 = await request(app)
      .get(`/notes?stack=testCollection&tag=${tag2.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 1)
    await tap.equal(res2.body.items.length, 1)
  })

  await tap.test('Filter Notes by collection, flag and tag', async () => {
    const res2 = await request(app)
      .get(`/notes?stack=testCollection&tag=${tag2.id}&flag=question`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 1)
    await tap.equal(res2.body.items.length, 1)
  })

  await tap.test('Filter Notes by document and motivation', async () => {
    const res2 = await request(app)
      .get(`/notes?document=doc1&motivation=highlighting`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 3)
    await tap.equal(res2.body.items.length, 3)
  })

  await tap.test('Filter Notes by document and search', async () => {
    const res2 = await request(app)
      .get(`/notes?document=doc1&search=abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 2)
    await tap.equal(res2.body.items.length, 2)
  })

  await tap.test('Filter Notes by notebook and collection', async () => {
    const res2 = await request(app)
      .get(`/notes?notebook=${notebook.shortId}&stack=testCollection`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 2)
    await tap.equal(res2.body.items.length, 2)
    await tap.ok(_.find(res2.body.items, { shortId: note1.shortId }))
    await tap.ok(_.find(res2.body.items, { shortId: note5.shortId }))
  })

  await tap.test('Filter Notes by notebook and document', async () => {
    const res2 = await request(app)
      .get(`/notes?notebook=${notebook.shortId}&document=doc1`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 3)
    await tap.equal(res2.body.items.length, 3)
    await tap.ok(_.find(res2.body.items, { shortId: note13.shortId }))
    await tap.ok(_.find(res2.body.items, { shortId: note5.shortId }))
    await tap.ok(_.find(res2.body.items, { shortId: note14.shortId }))
  })

  await tap.test('Filter Notes by notebook and flag', async () => {
    const res2 = await request(app)
      .get(`/notes?notebook=${notebook.shortId}&flag=question`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 1)
    await tap.equal(res2.body.items.length, 1)
    await tap.ok(_.find(res2.body.items, { shortId: note5.shortId }))
  })

  await tap.test('Filter Notes by colour and search', async () => {
    const res = await request(app)
      .get(`/notes?colour=colour1&search=abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.ok(res.body.totalItems, 2)
    await tap.equal(res.body.items.length, 2)
    await tap.ok(_.find(res.body.items, { shortId: note5.shortId }))
    await tap.ok(_.find(res.body.items, { shortId: note11.shortId }))
  })

  await tap.test('Filter Notes by colour and motivation', async () => {
    const res = await request(app)
      .get(`/notes?colour=colour1&motivation=highlighting`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.ok(res.body.totalItems, 1)
    await tap.equal(res.body.items.length, 1)
    await tap.ok(_.find(res.body.items, { shortId: note5.shortId }))
  })

  await tap.test('Filter Notes by colour and flag', async () => {
    const res = await request(app)
      .get(`/notes?colour=colour1&flag=question`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.ok(res.body.totalItems, 1)
    await tap.equal(res.body.items.length, 1)
    await tap.ok(_.find(res.body.items, { shortId: note5.shortId }))
  })

  await tap.test('Filter Notes by colour and notebook', async () => {
    const res = await request(app)
      .get(`/notes?colour=colour1&notebook=${notebook.shortId}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.ok(res.body.totalItems, 2)
    await tap.equal(res.body.items.length, 2)
    await tap.ok(_.find(res.body.items, { shortId: note5.shortId }))
    await tap.ok(_.find(res.body.items, { shortId: note9.shortId }))
  })

  await tap.test('Filter Notes by colour and source', async () => {
    const res = await request(app)
      .get(`/notes?colour=colour1&source=${sourceId2}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.ok(res.body.totalItems, 3)
    await tap.equal(res.body.items.length, 3)
    await tap.ok(_.find(res.body.items, { shortId: note5.shortId }))
    await tap.ok(_.find(res.body.items, { shortId: note9.shortId }))
    await tap.ok(_.find(res.body.items, { shortId: note11.shortId }))
  })

  await tap.test(
    'Filter Notes by colour, collection and motivation',
    async () => {
      const res = await request(app)
        .get(
          `/notes?colour=colour1&stack=testCollection&motivation=highlighting`
        )
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      await tap.ok(res.body)
      await tap.ok(res.body.totalItems, 1)
      await tap.equal(res.body.items.length, 1)
      await tap.ok(_.find(res.body.items, { shortId: note5.shortId }))
    }
  )

  await tap.test('Filter Notes by notebook and motivation', async () => {
    const res2 = await request(app)
      .get(`/notes?notebook=${notebook.shortId}&motivation=highlighting`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 2)
    await tap.equal(res2.body.items.length, 2)
    await tap.ok(_.find(res2.body.items, { shortId: note5.shortId }))
    await tap.ok(_.find(res2.body.items, { shortId: note14.shortId }))
  })

  await tap.test('Filter Notes by notebook and search', async () => {
    const res2 = await request(app)
      .get(`/notes?notebook=${notebook.shortId}&search=abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 2)
    await tap.equal(res2.body.items.length, 2)
    await tap.ok(_.find(res2.body.items, { shortId: note5.shortId }))
    await tap.ok(_.find(res2.body.items, { shortId: note13.shortId }))
  })

  await tap.test('Filter Notes by notebook and source', async () => {
    const res2 = await request(app)
      .get(`/notes?notebook=${notebook.shortId}&source=${sourceId2}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 5)
    await tap.equal(res2.body.items.length, 5)
    await tap.ok(_.find(res2.body.items, { shortId: note5.shortId }))
    await tap.ok(_.find(res2.body.items, { shortId: note7.shortId }))
    await tap.ok(_.find(res2.body.items, { shortId: note9.shortId }))
    await tap.ok(_.find(res2.body.items, { shortId: note13.shortId }))
    await tap.ok(_.find(res2.body.items, { shortId: note14.shortId }))
  })

  await tap.test('Filter Notes by notebook and tag', async () => {
    const res2 = await request(app)
      .get(`/notes?notebook=${notebook.shortId}&tag=${tag2.id}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 2)
    await tap.equal(res2.body.items.length, 2)
    await tap.ok(_.find(res2.body.items, { shortId: note5.shortId }))
    await tap.ok(_.find(res2.body.items, { shortId: note7.shortId }))
  })

  await tap.test('Filter Notes by notebook, tag and search', async () => {
    const res2 = await request(app)
      .get(`/notes?notebook=${notebook.shortId}&tag=${tag2.id}&search=abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 1)
    await tap.equal(res2.body.items.length, 1)
    await tap.ok(_.find(res2.body.items, { shortId: note5.shortId }))
  })

  await tap.test(
    'Filter Notes by notebook, document, source and search',
    async () => {
      const res2 = await request(app)
        .get(
          `/notes?notebook=${
            notebook.shortId
          }&source=${sourceId2}&document=doc1&search=abc`
        )
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res2.status, 200)
      await tap.ok(res2.body)
      await tap.ok(res2.body.totalItems, 2)
      await tap.equal(res2.body.items.length, 2)
      await tap.ok(_.find(res2.body.items, { shortId: note5.shortId }))
      await tap.ok(_.find(res2.body.items, { shortId: note13.shortId }))
    }
  )

  await tap.test('Filter Notes by notebook and notMotivation', async () => {
    const res2 = await request(app)
      .get(`/notes?notebook=${notebook.shortId}&notMotivation=test`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 2)
    await tap.equal(res2.body.items.length, 2)
    await tap.ok(_.find(res2.body.items, { shortId: note5.shortId }))
    await tap.ok(_.find(res2.body.items, { shortId: note14.shortId }))
  })

  await tap.test('Filter Notes by collection and notMotivation', async () => {
    const res2 = await request(app)
      .get(`/notes?stack=testCollection&notMotivation=test`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 2)
    await tap.equal(res2.body.items.length, 2)
    await tap.ok(_.find(res2.body.items, { shortId: note5.shortId }))
    await tap.ok(_.find(res2.body.items, { shortId: note3.shortId }))
  })

  await tap.test('Filter Notes by document and notMotivation', async () => {
    const res2 = await request(app)
      .get(`/notes?document=doc1&notMotivation=test`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 3)
    await tap.equal(res2.body.items.length, 3)
    await tap.ok(_.find(res2.body.items, { shortId: note5.shortId }))
    await tap.ok(_.find(res2.body.items, { shortId: note14.shortId }))
    await tap.ok(_.find(res2.body.items, { shortId: note3.shortId }))
  })

  await tap.test('Filter Notes by source and notMotivation', async () => {
    const res2 = await request(app)
      .get(`/notes?source=${source2.shortId}&notMotivation=test`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 3)
    await tap.equal(res2.body.items.length, 3)
    await tap.ok(_.find(res2.body.items, { shortId: note14.shortId }))
    await tap.ok(_.find(res2.body.items, { shortId: note3.shortId }))
    await tap.ok(_.find(res2.body.items, { shortId: note5.shortId }))
  })

  await tap.test('Filter Notes by search and notMotivation', async () => {
    const res2 = await request(app)
      .get(`/notes?search=something&notMotivation=test`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 1)
    await tap.equal(res2.body.items.length, 1)
    await tap.ok(_.find(res2.body.items, { shortId: note14.shortId }))
  })

  await tap.test('Filter Notes by colour and notMotivation', async () => {
    const res2 = await request(app)
      .get(`/notes?colour=colour1&notMotivation=test`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 1)
    await tap.equal(res2.body.items.length, 1)
    await tap.ok(_.find(res2.body.items, { shortId: note5.shortId }))
  })

  await destroyDB(app)
}

module.exports = test
