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

  function sleep (ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  const time1 = new Date().toISOString()
  await sleep(50)
  await createNoteSimplified() // 1
  await createNoteSimplified() // 2
  await createNoteSimplified() // 3
  await createNoteSimplified() // 4
  await createNoteSimplified() // 5

  const time2 = new Date().toISOString()
  await sleep(50)
  await createNoteSimplified() // 6
  await createNoteSimplified() // 7
  await createNoteSimplified() // 8
  await createNoteSimplified() // 9
  await createNoteSimplified() // 10
  await createNoteSimplified() // 11
  await createNoteSimplified() // 12
  await createNoteSimplified() // 13

  const time3 = new Date().toISOString()
  await sleep(50)
  await createNoteSimplified()
  await createNoteSimplified()
  await createNoteSimplified()

  await tap.test('Filter Notes by date range - start only', async () => {
    const res = await request(app)
      .get(`/notes?publishedStart=${time3}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 3)
    await tap.equal(res.body.items.length, 3)
  })

  await tap.test('Filter Notes by date range - end only', async () => {
    const res = await request(app)
      .get(`/notes?publishedEnd=${time2}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 5)
    await tap.equal(res.body.items.length, 5)
  })

  await tap.test('Filter Notes by date range - start and end', async () => {
    const res = await request(app)
      .get(`/notes?publishedStart=${time2}&publishedEnd=${time3}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 200)
    await tap.ok(res.body)
    await tap.equal(res.body.totalItems, 8)
    await tap.equal(res.body.items.length, 8)
  })

  await tap.test(
    'Filter Notes by date range - start and end with pagination',
    async () => {
      const res = await request(app)
        .get(`/notes?publishedStart=${time1}&publishedEnd=${time3}&limit=11`)
        .set('Host', 'reader-api.test')
        .set('Authorization', `Bearer ${token}`)
        .type('application/ld+json')

      await tap.equal(res.status, 200)
      await tap.ok(res.body)

      await tap.equal(res.body.totalItems, 13)
      await tap.equal(res.body.items.length, 11)
    }
  )

  await tap.test('Try to filter notes with invalid date range', async () => {
    const res = await request(app)
      .get(`/notes?publishedStart=${time3}&publishedEnd=${time1}`)
      .set('Host', 'reader-api.test')
      .set('Authorization', `Bearer ${token}`)
      .type('application/ld+json')

    await tap.equal(res.status, 400)
  })

  await destroyDB(app)
}

module.exports = test
