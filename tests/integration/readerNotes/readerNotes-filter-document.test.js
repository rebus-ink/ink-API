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
const _ = require('lodash')

const test = async app => {
  const token = getToken()
  const readerId = await createUser(app, token)

  // create two publications:
  const publication = await createPublication(urlToId(readerId), {
    name: 'Publication A'
  })
  const publicationUrl = publication.id
  const publicationId1 = urlToId(publicationUrl)

  const publication2 = await createPublication(urlToId(readerId), {
    name: 'Publication B'
  })
  const publicationUrl2 = publication2.id
  const publicationId2 = urlToId(publicationUrl2)

  // creating two documents:
  const createdDocument = await createDocument(readerId, publicationUrl, {
    documentPath: 'path/1',
    mediaType: 'text/html',
    url: 'http://something/123'
  })

  const createdDocument2 = await createDocument(readerId, publicationUrl2, {
    documentPath: 'path/2',
    mediaType: 'text/html',
    url: 'http://something/124'
  })

  const documentUrl = `${publicationUrl}/${createdDocument.documentPath}`
  const documentUrl2 = `${publicationUrl2}/${createdDocument2.documentPath}`

  // create a whole bunch of notes:
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

  await destroyDB(app)
}

module.exports = test
