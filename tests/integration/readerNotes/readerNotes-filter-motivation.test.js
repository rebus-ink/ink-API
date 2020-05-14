const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createNote,
  createDocument
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

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

  const documentUrl = `${publicationUrl}${createdDocument.documentPath}`
  const documentUrl2 = `${publicationUrl2}${createdDocument2.documentPath}`

  const createNoteSimplified = async object => {
    const noteObj = Object.assign(
      {
        documentUrl,
        publicationId: publicationId1,
        body: { motivation: 'test' }
      },
      object
    )
    return await createNote(app, token, noteObj)
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

  await tap.test('Filter Notes by motivation with pagination', async () => {
    const res = await request(app)
      .get(`/notes?motivation=test&limit=11&page=3`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 26)
    await tap.equal(res.body.items.length, 4)
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

  await destroyDB(app)
}

module.exports = test
