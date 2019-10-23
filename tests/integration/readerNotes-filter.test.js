const request = require('supertest')
const tap = require('tap')
const urlparse = require('url').parse
const {
  getToken,
  createUser,
  destroyDB,
  getActivityFromUrl,
  createPublication,
  createNote,
  createDocument,
  createTag,
  addNoteToCollection
} = require('../utils/utils')
const { urlToId } = require('../../utils/utils')

const test = async app => {
  if (!process.env.POSTGRE_INSTANCE) {
    await app.initialize()
  }

  const token = getToken()
  const readerId = await createUser(app, token)
  const readerUrl = urlparse(readerId).path

  const publication = await createPublication(readerUrl, {
    name: 'Publication A'
  })
  const publicationUrl = publication.id

  // create another publication
  const publication2 = await createPublication(readerUrl, {
    name: 'Publication B'
  })
  const publicationUrl2 = publication2.id

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
      { inReplyTo: documentUrl, context: publicationUrl },
      object
    )
    return await createNote(app, token, readerUrl, noteObj)
  }

  await createNoteSimplified({ content: 'first' })
  await createNoteSimplified({ content: 'second' })
  await createNoteSimplified({ content: 'third' })
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
    context: publicationUrl2,
    inReplyTo: documentUrl2
  })
  await createNoteSimplified({
    context: publicationUrl2,
    inReplyTo: documentUrl2
  })

  let noteId1, noteId2, noteId3

  // --------------------------------------------- PUBLICATION -----------------------------------

  await tap.test('Filter Notes by Publication', async () => {
    const res = await request(app)
      .get(`${readerUrl}/notes?publication=${publicationUrl2}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.status, 200)
    const body = res.body

    await tap.equal(body.totalItems, 2)
    await tap.equal(body.items.length, 2)
    await tap.equal(body.items[0].type, 'Note')

    noteId1 = body.items[0].id
  })

  await createNoteSimplified({
    context: publicationUrl2,
    inReplyTo: documentUrl2
  }) // 3
  await createNoteSimplified({
    context: publicationUrl2,
    inReplyTo: documentUrl2
  })
  await createNoteSimplified({
    context: publicationUrl2,
    inReplyTo: documentUrl2
  })
  await createNoteSimplified({
    context: publicationUrl2,
    inReplyTo: documentUrl2
  })
  await createNoteSimplified({
    context: publicationUrl2,
    inReplyTo: documentUrl2
  })
  await createNoteSimplified({
    context: publicationUrl2,
    inReplyTo: documentUrl2
  })
  await createNoteSimplified({
    context: publicationUrl2,
    inReplyTo: documentUrl2
  })
  await createNoteSimplified({
    context: publicationUrl2,
    inReplyTo: documentUrl2
  }) // 10
  await createNoteSimplified({
    context: publicationUrl2,
    inReplyTo: documentUrl2
  })
  await createNoteSimplified({
    context: publicationUrl2,
    inReplyTo: documentUrl2
  })
  await createNoteSimplified({
    context: publicationUrl2,
    inReplyTo: documentUrl2
  }) // 13

  await tap.test('Filter Notes by Publication with pagination', async () => {
    const res2 = await request(app)
      .get(`${readerUrl}/notes?publication=${urlToId(publicationUrl2)}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.status, 200)
    await tap.equal(res2.body.items.length, 10)

    noteId2 = res2.body.items[3].id
    noteId3 = res2.body.items[5].id

    const res3 = await request(app)
      .get(`${readerUrl}/notes?page=2&publication=${urlToId(publicationUrl2)}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res3.status, 200)
    await tap.equal(res3.body.totalItems, 13)
    await tap.equal(res3.body.items.length, 3)

    const res4 = await request(app)
      .get(`${readerUrl}/notes?limit=11&page=2&publication=${publicationUrl2}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res4.status, 200)
    await tap.equal(res4.body.totalItems, 13)
    await tap.equal(res4.body.items.length, 2)
  })

  await tap.test('Filter Notes by nonexistant Publication', async () => {
    const res = await request(app)
      .get(`${readerUrl}/notes?publication=${publicationUrl2}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.status, 200)
    const body = res.body

    await tap.equal(body.totalItems, 0)
    await tap.equal(body.items.length, 0)
  })

  // ----------------------------------------- DOCUMENT ----------------------------------------------------

  await tap.test('Filter Notes by documentUrl', async () => {
    const res = await request(app)
      .get(`${readerUrl}/notes?document=${documentUrl2}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )
    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 13)
    await tap.equal(res.body.items.length, 13) // no pagination with documentUrl filter
  })

  await tap.test(
    'Filter Notes by documentUrl should not work with pagination',
    async () => {
      const res2 = await request(app)
        .get(`${readerUrl}/notes?document=${documentUrl2}&page=2`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type(
          'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
        )

      await tap.equal(res2.status, 200)
      await tap.ok(res2.body)
      await tap.equal(res2.body.totalItems, 13)
      await tap.equal(res2.body.items.length, 13)
    }
  )

  await tap.test('Filter Notes by a nonexistant documentUrl', async () => {
    const res = await request(app)
      .get(`${readerUrl}/notes?document=${documentUrl2}abc`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.items.length, 0)
  })

  // ------------------------------------------------ NOTE TYPE -------------------------------------------

  await createNoteSimplified({
    context: publicationUrl2,
    inReplyTo: documentUrl2,
    noteType: 'new'
  })
  await createNoteSimplified({
    context: publicationUrl2,
    inReplyTo: documentUrl2,
    noteType: 'new'
  })

  await createNoteSimplified({ noteType: 'new' })

  await tap.test('Filter Notes by noteType', async () => {
    const res = await request(app)
      .get(`${readerUrl}/notes?type=new`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 3)
    await tap.equal(res.body.items.length, 3)
  })

  await tap.test('Filter Notes by an inexistant noteType', async () => {
    const res = await request(app)
      .get(`${readerUrl}/notes?type=notANoteType`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.items.length, 0)
  })

  // ------------------------------------ SEARCH NOTE CONTENT ----------------------------------

  await tap.test('Search Note content', async () => {
    await createNoteSimplified({
      noteType: 'test',
      content: 'this string contains abc and other things'
    })
    await createNoteSimplified({
      noteType: 'test',
      content: 'this string contains ABCD and other things'
    })
    await createNoteSimplified({
      noteType: 'test2',
      content: 'this string contains XYABC and other things'
    })
    await createNoteSimplified({
      context: publicationUrl2,
      inReplyTo: documentUrl2,
      noteType: 'test',
      content: 'abc'
    })

    const res = await request(app)
      .get(`${readerUrl}/notes?search=abc`)
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

  const tagCreateRes = await createTag(app, token, readerUrl, {
    name: 'testCollection'
  })
  const tagActivityObject = await getActivityFromUrl(
    app,
    tagCreateRes.get('Location'),
    token
  )
  const tagId = tagActivityObject.object.id

  // add 3 notes to this collection
  await addNoteToCollection(app, token, readerUrl, urlToId(noteId1), tagId)
  await addNoteToCollection(app, token, readerUrl, urlToId(noteId2), tagId)
  await addNoteToCollection(app, token, readerUrl, urlToId(noteId3), tagId)

  await tap.test('Get Notes by Collection', async () => {
    const res = await request(app)
      .get(`${readerUrl}/notes?stack=testCollection`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 3)
    await tap.equal(res.body.items.length, 3)
  })

  // ----------------------------------- COMBINING FILTERS -----------------------------------

  await tap.test('Filter Notes by noteType and PubId', async () => {
    const res2 = await request(app)
      .get(`${readerUrl}/notes?type=new&publication=${publicationUrl2}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.ok(res2.body.totalItems, 2)
    await tap.equal(res2.body.items.length, 2)
  })

  await tap.test('Search Notes and filter by noteType', async () => {
    const res2 = await request(app)
      .get(`${readerUrl}/notes?search=abc&type=test2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res2.status, 200)
    await tap.ok(res2.body)
    await tap.equal(res2.body.totalItems, 1)
    await tap.equal(res2.body.items.length, 1)
  })

  await tap.test('Search Notes and filter by Document', async () => {
    const res3 = await request(app)
      .get(`${readerUrl}/notes?search=abc&document=${documentUrl}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type(
        'application/ld+json; profile="https://www.w3.org/ns/activitystreams"'
      )

    await tap.equal(res3.status, 200)
    await tap.ok(res3.body)
    await tap.ok(res3.body.totalItems, 3)
    await tap.equal(res3.body.items.length, 3)
  })

  if (!process.env.POSTGRE_INSTANCE) {
    await app.terminate()
  }
  await destroyDB(app)
}

module.exports = test
