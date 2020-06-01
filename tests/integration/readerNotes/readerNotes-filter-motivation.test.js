const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createSource,
  createNote
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')

const test = async app => {
  const token = getToken()
  const readerId = await createUser(app, token)

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

  // create more notes for another source
  await createNoteSimplified({
    sourceId: sourceId2
  })
  await createNoteSimplified({
    sourceId: sourceId2
  })

  await createNoteSimplified({
    sourceId: sourceId2
  })
  await createNoteSimplified({
    sourceId: sourceId2
  })
  await createNoteSimplified({
    sourceId: sourceId2
  })
  await createNoteSimplified({
    sourceId: sourceId2
  })
  await createNoteSimplified({
    sourceId: sourceId2
  })
  await createNoteSimplified({
    sourceId: sourceId2
  })
  await createNoteSimplified({
    sourceId: sourceId2
  })
  await createNoteSimplified({
    sourceId: sourceId2
  }) // 10
  await createNoteSimplified({
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
    body: { motivation: 'highlighting' }
  })
  await createNoteSimplified({
    sourceId: sourceId2,
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
