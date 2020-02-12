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
const _ = require('lodash')

const test = async app => {
  const token = getToken()
  const readerId = await createUser(app, token)

  const createNoteSimplified = async object => {
    const noteObj = Object.assign(
      {
        body: { motivation: 'test' }
      },
      object
    )
    return await createNote(app, token, urlToId(readerId), noteObj)
  }

  const note1 = await createNoteSimplified() // 1
  const note2 = await createNoteSimplified() // 2
  const note3 = await createNoteSimplified() // 3
  const note4 = await createNoteSimplified() // 4
  const note5 = await createNoteSimplified() // 5
  const note6 = await createNoteSimplified() // 6
  const note7 = await createNoteSimplified() // 7
  const note8 = await createNoteSimplified() // 8
  const note9 = await createNoteSimplified() // 9
  const note10 = await createNoteSimplified() // 10
  const note11 = await createNoteSimplified() // 11
  const note12 = await createNoteSimplified() // 12
  const note13 = await createNoteSimplified() // 13
  await createNoteSimplified()
  await createNoteSimplified()
  await createNoteSimplified()

  const tagCreated = await createTag(app, token, {
    name: 'testCollection'
  })
  const tagId = tagCreated.id
  // add 13 notes to this collection
  await addNoteToCollection(app, token, urlToId(note1.id), tagId)
  await addNoteToCollection(app, token, urlToId(note2.id), tagId)
  await addNoteToCollection(app, token, urlToId(note3.id), tagId)

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

  await addNoteToCollection(app, token, urlToId(note4.id), tagId)
  await addNoteToCollection(app, token, urlToId(note5.id), tagId)
  await addNoteToCollection(app, token, urlToId(note6.id), tagId)
  await addNoteToCollection(app, token, urlToId(note7.id), tagId)
  await addNoteToCollection(app, token, urlToId(note8.id), tagId)
  await addNoteToCollection(app, token, urlToId(note9.id), tagId)
  await addNoteToCollection(app, token, urlToId(note10.id), tagId)
  await addNoteToCollection(app, token, urlToId(note11.id), tagId)
  await addNoteToCollection(app, token, urlToId(note12.id), tagId)
  await addNoteToCollection(app, token, urlToId(note13.id), tagId)

  await tap.test('Get Notes by Collection with pagination', async () => {
    const res = await request(app)
      .get(`/notes?stack=testCollection&limit=12&page=2`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 13)
    await tap.equal(res.body.items.length, 1)
  })

  await destroyDB(app)
}

module.exports = test
