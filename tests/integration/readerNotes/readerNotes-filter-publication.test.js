const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createPublication,
  createNote
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  await createUser(app, token)

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
    publicationId: publicationId2
  })
  await createNoteSimplified({
    publicationId: publicationId2
  })

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
    publicationId: publicationId2
  })
  await createNoteSimplified({
    publicationId: publicationId2
  })
  await createNoteSimplified({
    publicationId: publicationId2
  })
  await createNoteSimplified({
    publicationId: publicationId2
  })
  await createNoteSimplified({
    publicationId: publicationId2
  })
  await createNoteSimplified({
    publicationId: publicationId2
  })
  await createNoteSimplified({
    publicationId: publicationId2
  })
  await createNoteSimplified({
    publicationId: publicationId2
  }) // 10
  await createNoteSimplified({
    publicationId: publicationId2
  })
  await createNoteSimplified({
    publicationId: publicationId2
  })
  await createNoteSimplified({
    publicationId: publicationId2
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

  await destroyDB(app)
}

module.exports = test
