const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createNote,
  createDocument,
  createTag,
  addNoteToCollection
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerId = await createUser(app, token)
  const readerUrl = `/readers/${urlToId(readerId)}`

  const publication = await createPublication(urlToId(readerId), {
    name: 'Publication A'
  })
  const publicationUrl = publication.id
  const publicationId1 = urlToId(publicationUrl)

  // create another publication
  const publication2 = await createPublication(urlToId(readerId), {
    name: 'Publication B'
  })
  const publicationUrl2 = publication2.id
  const publicationId2 = urlToId(publicationUrl2)

  // creating a document
  const createdDocument = await createDocument(readerId, publicationUrl, {
    documentPath: 'path/1',
    mediaType: 'text/html',
    url: 'http://something/123'
  })

  // creating a second document
  const createdDocument2 = await createDocument(readerId, publicationUrl2, {
    documentPath: 'path/2',
    mediaType: 'text/html',
    url: 'http://something/124'
  })

  const documentUrl = `${publicationUrl}/${createdDocument.documentPath}`
  const documentUrl2 = `${publicationUrl2}/${createdDocument2.documentPath}`

  const createNoteSimplified = async object => {
    const noteObj = Object.assign(
      {
        documentUrl,
        publicationId: publicationId1,
        body: { motivation: 'test' }
      },
      object
    )
    return await createNote(app, token, urlToId(readerId), noteObj)
  }

  await createNoteSimplified() // 1
  await createNoteSimplified() // 2
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
  await createNoteSimplified({
    publicationId: publicationId2,
    documentUrl: documentUrl2
  })
  await createNoteSimplified({
    publicationId: publicationId2,
    documentUrl: documentUrl2
  })

  let noteId1, noteId2, noteId3

  // --------------------------------------------- PUBLICATION -----------------------------------

  await tap.test('Filter Notes by Publication', async () => {
    const res = await request(app)
      .get(`/notes?publication=${publicationUrl2}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    const body = res.body

    await tap.equal(body.totalItems, 2)
    await tap.equal(body.items.length, 2)
    await tap.equal(body.items[0].type, 'Note')
  })

  await createNoteSimplified({
    publicationId: publicationId2,
    documentUrl: documentUrl2
  })
  await createNoteSimplified({
    publicationId: publicationId2,
    documentUrl: documentUrl2
  })
  await createNoteSimplified({
    publicationId: publicationId2,
    documentUrl: documentUrl2
  })
  await createNoteSimplified({
    publicationId: publicationId2,
    documentUrl: documentUrl2
  })
  await createNoteSimplified({
    publicationId: publicationId2,
    documentUrl: documentUrl2
  })
  await createNoteSimplified({
    publicationId: publicationId2,
    documentUrl: documentUrl2
  })
  await createNoteSimplified({
    publicationId: publicationId2,
    documentUrl: documentUrl2
  })
  await createNoteSimplified({
    publicationId: publicationId2,
    documentUrl: documentUrl2
  }) // 10
  await createNoteSimplified({
    publicationId: publicationId2,
    documentUrl: documentUrl2
  })
  await createNoteSimplified({
    publicationId: publicationId2,
    documentUrl: documentUrl2
  })
  await createNoteSimplified({
    publicationId: publicationId2,
    documentUrl: documentUrl2
  })

  await tap.test('Filter Notes by Publication with pagination', async () => {
    const res2 = await request(app)
      .get(`/notes?publication=${urlToId(publicationUrl2)}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.equal(res2.body.items.length, 10)
    noteId1 = res2.body.items[0].id
    noteId2 = res2.body.items[3].id
    noteId3 = res2.body.items[5].id

    const res3 = await request(app)
      .get(`/notes?page=2&publication=${urlToId(publicationUrl2)}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res3.status, 200)
    await tap.equal(res3.body.totalItems, 13)
    await tap.equal(res3.body.items.length, 3)

    const res4 = await request(app)
      .get(`/notes?limit=11&page=2&publication=${publicationUrl2}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res4.status, 200)
    await tap.equal(res4.body.totalItems, 13)
    await tap.equal(res4.body.items.length, 2)
  })

  await tap.test('Filter Notes by nonexistant Publication', async () => {
    const res = await request(app)
      .get(`/notes?publication=${publicationUrl2}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    const body = res.body

    await tap.equal(body.totalItems, 0)
    await tap.equal(body.items.length, 0)
  })

  // ----------------------------------------- DOCUMENT ----------------------------------------------------

  await tap.test('Filter Notes by documentUrl', async () => {
    const res = await request(app)
      .get(`/notes?document=${documentUrl2}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')
    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 13)
    await tap.equal(res.body.items.length, 13) // no pagination with documentUrl filter
  })

  await tap.test(
    'Filter Notes by documentUrl should not work with pagination',
    async () => {
      const res2 = await request(app)
        .get(`/notes?document=${documentUrl2}&page=2`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res2.status, 200)
      await tap.ok(res2.body)
      await tap.equal(res2.body.totalItems, 13)
      await tap.equal(res2.body.items.length, 13)
    }
  )

  await tap.test('Filter Notes by a nonexistant documentUrl', async () => {
    const res = await request(app)
      .get(`/notes?document=${documentUrl2}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.items.length, 0)
  })

  // ------------------------------------------------ MOTIVATION -------------------------------------------

  await createNoteSimplified({
    publicationId: publicationId2,
    documentUrl: documentUrl2,
    body: { motivation: 'highlighting' }
  })
  await createNoteSimplified({
    publicationId: publicationId2,
    documentUrl: documentUrl2,
    body: { motivation: 'highlighting' }
  })

  await createNoteSimplified({
    body: { motivation: 'highlighting' }
  })
  await tap.test('Filter Notes by motivation', async () => {
    const res = await request(app)
      .get(`/notes?motivation=highlighting`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 3)
    await tap.equal(res.body.items.length, 3)
  })

  await tap.test('Filter Notes by an inexistant motivation', async () => {
    const res = await request(app)
      .get(`/notes?motivation=somethingElse`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.items.length, 0)
  })

  // ------------------------------------ SEARCH NOTE CONTENT ----------------------------------

  await tap.test('Search Note content', async () => {
    await createNoteSimplified({
      body: {
        motivation: 'test',
        content: 'this string contains abc and other things'
      }
    })
    await createNoteSimplified({
      body: {
        motivation: 'test',
        content: 'this string contains ABCD and other things'
      }
    })
    await createNoteSimplified({
      body: {
        motivation: 'test',
        content: 'this string contains XYABC and other things'
      },
      publicationId: publicationId2,
      documentUrl: documentUrl2
    })
    await createNoteSimplified({
      body: {
        motivation: 'highlighting',
        content: 'abc'
      }
    })

    const res = await request(app)
      .get(`/notes?search=abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 4)
    await tap.equal(res.body.items.length, 4)
  })

  // --------------------------------------------- COLLECTION ---------------------------------------

  const tagCreated = await createTag(app, token, {
    name: 'testCollection'
  })
  const tagId = tagCreated.id
  // add 3 notes to this collection
  await addNoteToCollection(app, token, urlToId(noteId1), tagId)
  await addNoteToCollection(app, token, urlToId(noteId2), tagId)
  await addNoteToCollection(app, token, urlToId(noteId3), tagId)

  await tap.test('Get Notes by Collection', async () => {
    const res = await request(app)
      .get(`/notes?stack=testCollection`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 3)
    await tap.equal(res.body.items.length, 3)
  })

  // ----------------------------------- COMBINING FILTERS -----------------------------------

  await tap.test('Filter Notes by motivation and PubId', async () => {
    const res2 = await request(app)
      .get(`/notes?motivation=highlighting&publication=${publicationUrl2}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 2)
    await tap.equal(res2.body.items.length, 2)
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

  await tap.test('Search Notes and filter by Document', async () => {
    const res3 = await request(app)
      .get(`/notes?search=abc&document=${documentUrl}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res3.status, 200)
    await tap.ok(res3.body)
    await tap.ok(res3.body.totalItems, 3)
    await tap.equal(res3.body.items.length, 3)
  })

  await destroyDB(app)
}

module.exports = test
