const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createNote,
  createTag,
  addNoteToCollection
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')
const _ = require('lodash')

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

  const note0 = await createNoteSimplified() // collection
  await createNoteSimplified({ body: { motivation: 'highlighting' } }) // 2
  await createNoteSimplified() // 3
  await createNoteSimplified() // 4
  await createNoteSimplified() // 5
  await createNoteSimplified() // 6
  await createNoteSimplified() // 7
  await createNoteSimplified() // 8
  await createNoteSimplified() // 9
  await createNoteSimplified() // 10
  await createNoteSimplified() // 11
  await createNoteSimplified() // 12
  await createNoteSimplified() // 13

  // create more notes for another source
  const note1 = await createNoteSimplified({
    // collection
    sourceId: sourceId2,
    body: { motivation: 'highlighting' },
    document: 'doc1'
  })
  const note2 = await createNoteSimplified({
    // collection
    sourceId: sourceId2,
    document: 'doc1'
  })

  const note3 = await createNoteSimplified({
    // collection & flag
    sourceId: sourceId2,
    document: 'doc1',
    body: { motivation: 'highlighting', content: 'this contains abc' }
  })
  const note4 = await createNoteSimplified({
    sourceId: sourceId2
  })
  const note5 = await createNoteSimplified({
    sourceId: sourceId2
  })
  await createNoteSimplified({
    sourceId: sourceId2
  })
  await createNoteSimplified({
    sourceId: sourceId2
  })
  await createNoteSimplified({
    sourceId: sourceId2,
    body: { motivation: 'test', content: 'a!bc' }
  })
  await createNoteSimplified({
    sourceId: sourceId2,
    document: 'doc2',
    body: { motivation: 'test', content: 'this contains abc' }
  })
  await createNoteSimplified({
    sourceId: sourceId2
  }) // 10
  await createNoteSimplified({
    sourceId: sourceId2,
    document: 'doc1',
    body: { motivation: 'test', content: 'ABCDE' }
  })
  await createNoteSimplified({
    sourceId: sourceId2,
    document: 'doc1',
    body: { motivation: 'highlighting', content: 'something' }
  })
  await createNoteSimplified({
    sourceId: sourceId2
  })

  const tagCreated = await createTag(app, token, {
    name: 'testCollection'
  })
  const tagId = tagCreated.id
  // add 3 notes to this collection
  await addNoteToCollection(app, token, urlToId(note0.id), tagId)
  await addNoteToCollection(app, token, urlToId(note1.id), tagId)
  await addNoteToCollection(app, token, urlToId(note2.id), tagId)
  await addNoteToCollection(app, token, urlToId(note3.id), tagId)

  const tag2 = await createTag(app, token)
  const tagsres = await request(app)
    .get(`/tags`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')

  const questionTagId = _.find(tagsres.body, { name: 'question' }).id

  // assign notes to workspace
  await addNoteToCollection(app, token, urlToId(note3.id), tag2.id)
  await addNoteToCollection(app, token, urlToId(note4.id), tag2.id)
  await addNoteToCollection(app, token, urlToId(note5.id), tag2.id)

  // assign notes to flag
  await addNoteToCollection(app, token, urlToId(note3.id), questionTagId)

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

  await destroyDB(app)
}

module.exports = test
