const request = require('supertest')
const tap = require('tap')
const {
  getToken,
  createUser,
  destroyDB,
  createNote,
  addNoteToCollection
} = require('../../utils/testUtils')
const { urlToId } = require('../../../utils/utils')
const _ = require('lodash')

const test = async app => {
  const token = getToken()
  const readerId = await createUser(app, token)

  // get reader workspace tags:
  const tagsres = await request(app)
    .get(`/tags`)
    .set('Host', 'reader-api.test')
    .set('Authorization', `Bearer ${token}`)
    .type('application/ld+json')

  const researchTagId = _.find(tagsres.body, { name: 'Research' }).id

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

  // add 13 notes to research workspace
  await addNoteToCollection(app, token, urlToId(note1.id), researchTagId)
  await addNoteToCollection(app, token, urlToId(note2.id), researchTagId)
  await addNoteToCollection(app, token, urlToId(note3.id), researchTagId)

  await tap.test('Get Notes by Workspace', async () => {
    const res = await request(app)
      .get(`/notes?workspace=ReseArch`) // not case sensitive
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 3)
    await tap.equal(res.body.items.length, 3)
  })

  await addNoteToCollection(app, token, urlToId(note4.id), researchTagId)
  await addNoteToCollection(app, token, urlToId(note5.id), researchTagId)
  await addNoteToCollection(app, token, urlToId(note6.id), researchTagId)
  await addNoteToCollection(app, token, urlToId(note7.id), researchTagId)
  await addNoteToCollection(app, token, urlToId(note8.id), researchTagId)
  await addNoteToCollection(app, token, urlToId(note9.id), researchTagId)
  await addNoteToCollection(app, token, urlToId(note10.id), researchTagId)
  await addNoteToCollection(app, token, urlToId(note11.id), researchTagId)
  await addNoteToCollection(app, token, urlToId(note12.id), researchTagId)
  await addNoteToCollection(app, token, urlToId(note13.id), researchTagId)

  await tap.test('Get Notes by Workspace with pagination', async () => {
    const res = await request(app)
      .get(`/notes?workspace=research&limit=12&page=2`)
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
