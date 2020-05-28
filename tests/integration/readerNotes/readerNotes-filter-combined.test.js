const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createNote,
  createTag,
  addNoteToCollection
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')
const _ = require('lodash')

const test = async app => {
  const token = getToken()
  const readerId = await createUser(app, token)

  const publication = await createPublication(app, token, {
    name: 'Publication A'
  })
  const publicationUrl = publication.id
  const publicationId1 = urlToId(publicationUrl)

  // create another publication
  const publication2 = await createPublication(app, token, {
    name: 'Publication B'
  })
  const publicationUrl2 = publication2.id
  const publicationId2 = urlToId(publicationUrl2)

  const createNoteSimplified = async object => {
    const noteObj = Object.assign(
      {
        publicationId: publicationId1,
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

  // create more notes for another pub
  const note1 = await createNoteSimplified({
    // collection
    publicationId: publicationId2,
    body: { motivation: 'highlighting' }
  })
  const note2 = await createNoteSimplified({
    // collection
    publicationId: publicationId2
  })

  const note3 = await createNoteSimplified({
    // collection & workspace & flag
    publicationId: publicationId2,
    body: { motivation: 'highlighting', content: 'this contains abc' }
  })
  const note4 = await createNoteSimplified({
    // workspace
    publicationId: publicationId2
  })
  const note5 = await createNoteSimplified({
    // workspace
    publicationId: publicationId2
  })
  await createNoteSimplified({
    publicationId: publicationId2
  })
  await createNoteSimplified({
    publicationId: publicationId2
  })
  await createNoteSimplified({
    publicationId: publicationId2,
    body: { motivation: 'test', content: 'a!bc' }
  })
  await createNoteSimplified({
    publicationId: publicationId2,
    body: { motivation: 'test', content: 'this contains abc' }
  })
  await createNoteSimplified({
    publicationId: publicationId2
  }) // 10
  await createNoteSimplified({
    publicationId: publicationId2,
    body: { motivation: 'test', content: 'ABCDE' }
  })
  await createNoteSimplified({
    publicationId: publicationId2,
    body: { motivation: 'highlighting', content: 'something' }
  })
  await createNoteSimplified({
    publicationId: publicationId2
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

  // get reader workspace tags:
  const tagsres = await request(app)
    .get(`/tags`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')

  const researchTagId = _.find(tagsres.body, { name: 'Research' }).id
  const questionTagId = _.find(tagsres.body, { name: 'question' }).id

  // assign notes to workspace
  await addNoteToCollection(app, token, urlToId(note3.id), researchTagId)
  await addNoteToCollection(app, token, urlToId(note4.id), researchTagId)
  await addNoteToCollection(app, token, urlToId(note5.id), researchTagId)

  // assign notes to flag
  await addNoteToCollection(app, token, urlToId(note3.id), questionTagId)

  await tap.test('Filter Notes by motivation and PubId', async () => {
    const res2 = await request(app)
      .get(`/notes?motivation=highlighting&publication=${publicationUrl2}`)
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

  await tap.test('Filter Notes by motivation and worksapce', async () => {
    const res2 = await request(app)
      .get(`/notes?motivation=highlighting&workspace=research`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 1)
    await tap.equal(res2.body.items.length, 1)
  })

  await tap.test('Filter Notes by collection and workspace', async () => {
    const res2 = await request(app)
      .get(`/notes?stack=testCollection&workspace=Research`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 1)
    await tap.equal(res2.body.items.length, 1)
  })

  await tap.test('Filter Notes by collection, tag and workspace', async () => {
    const res2 = await request(app)
      .get(`/notes?stack=testCollection&workspace=Research&tag=question`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 1)
    await tap.equal(res2.body.items.length, 1)
  })

  await destroyDB(app)
}

module.exports = test
